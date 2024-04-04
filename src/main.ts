import * as core from '@actions/core'
import * as github from '@actions/github'
import axios from 'axios'
import {
  baseContent,
  getLineToComment,
  parseHunkHeader,
  shouldExcludeFile,
  systemContent
} from './utils'

type GptResponseFormat = {
  choices: {
    index: number
    message: {
      content: string
    }
    finish_reason: string
  }[]
}

type ReviewJsonFormat = {
  score: number
  reviews: { line?: number; message: string; hunk: string }[]
}

const RETURN_CODES = {
  SUCCESS: 0,
  FAILURE: 1
} as const

const handleError = (
  error: unknown,
  core: { setFailed: (msg: string) => void }
): number => {
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown error :c'

  core.setFailed(errorMessage)
  console.error(errorMessage)

  if (axios.isAxiosError(error)) {
    core.setFailed(error.response?.data)
  }

  return RETURN_CODES.FAILURE
}

/**
 * The main function for the action.
 * @returns {Promise<number>} Resolves when the action is complete.
 */
export async function run(): Promise<number> {
  try {
    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.info(`Starting action...`)

    // Fetching github token and getting octokit client
    const githubToken = core.getInput('github-token')
    const gptApiKey = core.getInput('gpt-api-key')
    const octokit = github.getOctokit(githubToken)

    // Get the context
    const { owner, repo, number } = github.context.issue

    core.info(`Fetching PR data for ${owner}/${repo}#${number}...`)
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: number
    })

    const commitId = pr.head.sha

    // Get PR files modified
    core.info(`Fetching PR files for ${owner}/${repo}#${number}...`)
    const { data: fileList } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: number
    })

    const files = fileList.filter(file => !shouldExcludeFile(file.filename))

    // List comments on the pull request
    core.info(`Fetching PR comments for ${owner}/${repo}#${number}...`)
    const { data: comments } = await octokit.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: number
    })

    // Find and delete the comment at the specific position
    core.info(`Deleting existing comments for ${owner}/${repo}#${number}...`)
    for (const comment of comments) {
      if (comment.user.login === 'github-actions[bot]') {
        await octokit.rest.pulls.deleteReviewComment({
          owner,
          repo,
          comment_id: comment.id
        })
        console.log(`Deleted comment ${comment.line} on ${comment.path}`)
      }
    }

    core.info(`Processing PR files for ${owner}/${repo}#${number}...`)
    for (const file of files) {
      const filePath = file.filename
      const patch = file.patch

      if (!patch) {
        core.info(`Skipping ${filePath} as it has no patch data...`)
        continue
      }

      // Send the patch data to ChatGPT for review
      try {
        core.info(
          `Sending patch data to ChatGPT for ${owner}/${repo}#${number}...`
        )
        const { data: gptResponse } = await axios.post<GptResponseFormat>(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4-1106-preview',
            messages: [
              {
                role: 'system',
                content: systemContent
              },
              {
                role: 'user',
                content: `${baseContent}${patch}`
              }
            ],
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              Authorization: `Bearer ${gptApiKey}`
            }
          }
        )
        const review = JSON.parse(
          gptResponse.choices[0].message.content
        ) as ReviewJsonFormat

        const formattedReviews = review.reviews.map(reviewItem => {
          const line = getLineToComment(reviewItem.hunk)
          return {
            ...reviewItem,
            line
          }
        })

        if (review.score < 75) {
          // Comment PR with GPT response
          for (const reviewItem of formattedReviews) {
            core.info(`Commenting on PR line ${reviewItem.line}...`)
            if (!reviewItem.line) {
              core.error(
                `Invalid review item - has no position : ${JSON.stringify(reviewItem)}`
              )
              continue
            }

            try {
              await octokit.rest.pulls.createReviewComment({
                owner,
                repo,
                pull_number: number,
                body: reviewItem.message,
                path: filePath,
                commit_id: commitId,
                line: reviewItem.line
              })
            } catch (error) {
              core.error(`Invalid review item: ${JSON.stringify(reviewItem)}`)
              core.error(error as Error)
            }
          }
        }
      } catch (error) {
        return handleError(error, core)
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    return handleError(error, core)
  }

  return RETURN_CODES.SUCCESS
}
