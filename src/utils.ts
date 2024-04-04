export const baseContent = `Review GitHub patch file. Focus your evaluation on adherence to coding best practices.
Rate the code on a scale from 1 to 100, where 1 is the worst and 100 is the best. Rate 100 if the file is not maintained by developer, such as lockfile.
Answer with a numbered list. Do not go beyond 5 reviews you found in the code. You can provide less than 5 reviews. Each item should be a single concise sentence.
Use the folowing json format : { "score": value, "reviews": [{ hunk: hunk header where comment should appear, message: "content of the comment}, ...]}`

export const systemContent = `You are a software engineer reviewing a patch file from a pull request.`

export function parseHunkHeader(header: string) {
  // Regular expression to match the hunk header format
  const regex = /@@ \-(\d+),(\d+) \+(\d+),(\d+) @@/
  const match = header.match(regex)

  if (match) {
    return {
      originalStartLine: parseInt(match[1], 10),
      originalLineCount: parseInt(match[2], 10),
      newStartLine: parseInt(match[3], 10),
      newLineCount: parseInt(match[4], 10)
    }
  } else {
    throw new Error('Invalid hunk header format')
  }
}
