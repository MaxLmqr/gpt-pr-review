export const baseContent = `Review GitHub patch file. Focus your evaluation on adherence to coding best practices.
Rate the code on a scale from 1 to 100, where 1 is the worst and 100 is the best. 
Answer with a numbered list. Do not go beyond 5 reviews you found in the code. You can provide less than 5 reviews. Each item should be a single concise sentence.
Use the folowing json format : { "score": value, "reviews": [{ line: number of the line where comment should appear in the patch file, message: "content of the comment}, ...]}`

export const systemContent = `You are a software engineer reviewing a patch file from a pull request.`
