export const types = `
  type Dashboard {
    _id: String!
    name: String
  }

  type DashboardItem {
    _id: String!
    dashboardId: String
    layout: String
    vizState: String
    name: String
    type: String
  }
`;

export const queries = `
  dashboards(page: Int, perPage: Int): [Dashboard]
  dashboardsTotalCount: Int
  dashboardItems(dashboardId: String!): [DashboardItem]
  dashboardItemDetail(_id: String!): DashboardItem
`;

export const mutations = `
  dashboardAdd(name: String): Dashboard
  dashboardEdit(_id: String!, name: String!): Dashboard
  dashboardRemove(_id: String!): String
  dashboardItemAdd(dashboardId: String, layout: String, vizState: String, name: String, type: String): DashboardItem
  dashboardItemEdit(_id: String!, dashboardId:String, layout: String, vizState: String, name: String, type: String): DashboardItem
  dashboardItemRemove(_id: String!): String
  deleteDashboardItem(id: String!): DashboardItem
`;
