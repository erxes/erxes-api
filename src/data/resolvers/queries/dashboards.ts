import { DashboardItems, Dashboards } from '../../../db/models';
// import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { paginate } from '../../utils';

const dashBoardQueries = {
  dashboards(_root, args: { page: number; perPage: number }, { commonQuerySelector }: IContext) {
    console.log('sdjkadjk');
    return paginate(Dashboards.find(commonQuerySelector), args);
  },

  dashboardsTotalCount() {
    return Dashboards.find({}).countDocuments();
  },

  dashboardItems(_root, { dashboardId }: { dashboardId: string }) {
    return DashboardItems.find({ dashboardId });
  },

  dashboardItemDetail(_root, { _id }: { _id: string }) {
    return DashboardItems.findOne({ _id });
  },
};

// checkPermission(dashBoardQueries, 'dashboards', 'showDashboards', []);

export default dashBoardQueries;
