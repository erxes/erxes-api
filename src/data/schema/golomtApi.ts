export const mutations = `
  generateExpiredToken(apiKey: String, userName: String, password: String, tokenKey: String): JSON
  hookMessage(apiKey: String, apiToken: String, message: JSON): JSON
`;