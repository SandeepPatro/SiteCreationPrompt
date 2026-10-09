/** Hard caps shared by the API and the frontend. Model output and user input are clamped to these. */
export const LIMITS = {
  maxQuestions: 6,
  minQuestions: 3,
  label: 140,
  help: 240,
  option: 60,
  minOptions: 2,
  maxOptions: 8,
  idLen: 40,
  maxBodyBytes: 8 * 1024,
} as const;
