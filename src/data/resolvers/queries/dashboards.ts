import { DashboardItems, Dashboards } from '../../../db/models';
import { IContext } from '../../types';
import { paginate } from '../../utils';

const dashBoardQueries = {
  dashboards(_root, args: { page: number; perPage: number }, { commonQuerySelector }: IContext) {
    return paginate(Dashboards.find(commonQuerySelector), args);
  },

  dashboardsTotalCount() {
    return Dashboards.find({}).countDocuments();
  },

  dashboardItems() {
    return DashboardItems.find({});
  },

  dashboardItem(_root, { _id }: { _id: string }) {
    return DashboardItems.findOne({ _id });
  },
};

export default dashBoardQueries;
