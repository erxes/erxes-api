import { DashboardItems } from '../../../db/models';

const dashBoardQueries = {
  /**
   * Brands list
   */
  dashboardItems() {
    return DashboardItems.find({});
  },

  /**
   * Get one brand
   */
  dashboardItem(_root, { _id }: { _id: string }) {
    return DashboardItems.findOne({ _id });
  },
};

export default dashBoardQueries;
