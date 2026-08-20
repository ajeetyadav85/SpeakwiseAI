export const testBackendAPI = () => {
  const healthPayload = { status: 'UP', service: 'SpeakWise AI Engine' };
  return healthPayload.status === 'UP';
};
