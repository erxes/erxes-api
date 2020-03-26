import { DashboardItems, Dashboards } from '../../../db/models';

const dashBoardQueries = {
  dashboards() {
    return Dashboards.find({});
  },

  dashboardItems() {
    return DashboardItems.find({});
  },

  dashboardItem(_root, { _id }: { _id: string }) {
    return DashboardItems.findOne({ _id });
  },
};

export default dashBoardQueries;
