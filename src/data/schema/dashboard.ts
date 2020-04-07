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
  }
`;

export const queries = `
  dashboards(page: Int, perPage: Int): [Dashboard]
  dashboardsTotalCount: Int
  dashboardItems(dashboardId: String!): [DashboardItem]
  dashboardItemDetail(id: String!): DashboardItem
`;

export const mutations = `
  dashboardAdd(name: String): Dashboard
  dashboardEdit(_id: String!, name: String!): Dashboard
  dashboardRemove(_id: String!): JSON
  dashboardItemAdd(dashboardId:String!, layout: String, vizState: String, name: String): DashboardItem
  dashboardItemEdit(id: String!, dashboardId:String, layout: String, vizState: String, name: String): DashboardItem
  deleteDashboardItem(id: String!): DashboardItem
`;
