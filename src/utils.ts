export const baseContent = `You will receive a GitHub patch file content.
Assume that the code is not breaking anything. The developer knows what he's doing and is not doing any architecture mistake.
Do not comment on anything that COULD happen because of the modification.
Do not comment with compliment about the code. Do not assume any external factor.
Check for possible code improvment based on best practices. 
Rate the code from 1 to 100. 1 being the worst and 100 the best. Comment with the rate.
Answer : "No comment" if the rate is equal or above 80, or if there is no significant modification.
Do NOT explain what the code is doing. if the file is not a code file, answer "No comment".
Here is the code : \n`
