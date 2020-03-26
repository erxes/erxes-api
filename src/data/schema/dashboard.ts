export const types = `
  type Dashboard {
    id: String!
    name: String
  }

  type DashboardItem {
    id: String!
    dashboardId: String
    layout: String
    vizState: String
    name: String
  }
`;

export const queries = `
  dashboards: [Dashboard]
  dashboardItems: [DashboardItem]
  dashboardItem(id: String!): DashboardItem
`;

export const mutations = `
  dashboardAdd(name: String): Dashboard
  createDashboardItem(dashboardId:String!, layout: String, vizState: String, name: String): DashboardItem
  updateDashboardItem(id: String!, dashboardId:String!, layout: String, vizState: String, name: String): DashboardItem
  deleteDashboardItem(id: String!): DashboardItem
`;
