"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
const CONTEXT_LENGTH = 128000;
const COMMENT_POSITION = 1;
const RETURN_CODES = {
    SUCCESS: 0,
    FAILURE: 1
};
const handleError = (error, core) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error :c';
    core.setFailed(errorMessage);
    console.error(errorMessage);
    if (axios_1.default.isAxiosError(error)) {
        core.setFailed(error.response?.data);
    }
    return RETURN_CODES.FAILURE;
};
/**
 * The main function for the action.
 * @returns {Promise<number>} Resolves when the action is complete.
 */
async function run() {
    try {
        // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
        core.debug(`Starting action...`);
        // Fetching github token and getting octokit client
        const githubToken = core.getInput('github-token');
        const gptApiKey = core.getInput('gpt-api-key');
        const octokit = github.getOctokit(githubToken);
        // Get the context
        const { owner, repo, number } = github.context.issue;
        const { data: pr } = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number: number
        });
        const commitId = pr.head.sha;
        // Get PR files modified
        const { data: files } = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: number
        });
        // List comments on the pull request
        const { data: comments } = await octokit.rest.pulls.listReviewComments({
            owner,
            repo,
            pull_number: number
        });
        // Find and delete the comment at the specific position
        for (const comment of comments) {
            if (comment.position === COMMENT_POSITION) {
                await octokit.rest.pulls.deleteReviewComment({
                    owner,
                    repo,
                    comment_id: comment.id
                });
                console.log(`Deleted comment at position ${COMMENT_POSITION} - ${comment.path}`);
            }
        }
        for (const file of files) {
            const filePath = file.filename;
            const patch = file.patch;
            const numberOfCharacters = patch?.length || 0;
            const fileSizeLimit = CONTEXT_LENGTH - utils_1.baseContent.length;
            // Send the patch data to ChatGPT for review
            if (numberOfCharacters < fileSizeLimit) {
                try {
                    const { data: gptResponse } = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                        model: 'gpt-4-1106-preview',
                        messages: [
                            {
                                role: 'system',
                                content: utils_1.systemContent
                            },
                            {
                                role: 'user',
                                content: `${utils_1.baseContent}${patch}`
                            }
                        ]
                    }, {
                        headers: {
                            Authorization: `Bearer ${gptApiKey}`
                        }
                    });
                    const review = gptResponse.choices[0].message.content;
                    if (!review.includes('No comment')) {
                        // Comment PR with GPT response
                        await octokit.rest.pulls.createReviewComment({
                            owner,
                            repo,
                            pull_number: number,
                            body: review,
                            path: filePath,
                            commit_id: commitId,
                            position: COMMENT_POSITION
                        });
                    }
                }
                catch (error) {
                    return handleError(error, core);
                }
            }
            else {
                console.log('File is too large.');
            }
        }
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        return handleError(error, core);
    }
    return RETURN_CODES.SUCCESS;
}
exports.run = run;
//# sourceMappingURL=main.js.map