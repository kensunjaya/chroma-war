export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const convertColorFormat = (color: string): string => {
  switch (color) {
    case 'blue-400':
      return 'B';
    case 'red-400':
      return 'R';
    default:
      return 'N'; // Neutral
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildFewShotPrompt = (dataset: any, task: any) => {
  let prompt = "";
  for (const [input, output] of dataset) {
    prompt += `Q: ${input}\nA: ${output}\n`;
  }
  prompt += `Q: ${task}\nA:`;
  return prompt;
}