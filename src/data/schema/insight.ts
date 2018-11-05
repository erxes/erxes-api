export const types = ``;

const params = `
  integrationType: String,
  brandId: String,
  startDate: String,
  endDate: String
`;

export const queries = `
  insights(${params}): JSON
  insightsPunchCard(type: String, integrationType: String, brandId: String, endDate: String): JSON
  insightsMain(type: String, ${params}): JSON
  insightsFirstResponse(${params}): JSON
  insightsResponseClose(${params}): JSON
`;
