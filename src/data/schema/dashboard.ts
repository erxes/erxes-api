export const types = `
  type DashboardItem {
    id: String!
    layout: String
    vizState: String
    name: String
  }
`;

export const queries = `
  dashboardItems: [DashboardItem]
  dashboardItem(id: String!): DashboardItem
`;

export const mutations = `
  createDashboardItem(layout: String, vizState: String, name: String): DashboardItem
  updateDashboardItem(id: String!, layout: String, vizState: String, name: String): DashboardItem
  deleteDashboardItem(id: String!): DashboardItem
`;
