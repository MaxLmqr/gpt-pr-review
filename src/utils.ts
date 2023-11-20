export const baseContent = `You will receive a GitHub patch file content.
Assume that the code is not breaking anything. The developer knows what he's doing and is not doing any architecture mistake.
Do not comment on anything that COULD happen because of the modification.
Answer with the sentence : "No comment" if the rate is equal or above 80, or if there is no significant modification.
Do not comment with compliment about the code. Do not assume any external factor.
Check the code syntax, improvment, logic, performance, readability, maintainability, reusability, complexity, convention.
Rate the code from 1 to 100. 1 being the worst and 100 the best.
Do NOT explain what the code is doing. Answer with the rate, followed by a numbered list, the following patch : \n`
