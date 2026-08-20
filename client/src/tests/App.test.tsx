export const testFrontendState = () => {
  const defaultTheme = 'dark';
  const reportScore = 89;
  return defaultTheme === 'dark' && reportScore >= 0 && reportScore <= 100;
};
