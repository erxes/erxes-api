import { DashboardItems, Dashboards } from '../../../db/models';
import { IDashboard, IDashboardItemInput } from '../../../db/models/definitions/dashboard';
import { checkPermission } from '../../permissions/wrappers';

interface IDashboardEdit extends IDashboard {
  _id: string;
}
interface IDashboardItemEdit extends IDashboardItemInput {
  _id: string;
}

const dashboardsMutations = {
  async dashboardAdd(_root, doc: IDashboard) {
    const dashboard = await Dashboards.create({ ...doc });

    return dashboard;
  },

  async dashboardEdit(_root, { _id, ...fields }: IDashboardEdit) {
    const dashboard = await Dashboards.editDashboard(_id, fields);

    return dashboard;
  },

  async dashboardRemove(_root, { _id }: { _id: string }) {
    const removed = await Dashboards.removeDashboard(_id);

    return removed;
  },

  async dashboardItemAdd(_root, doc: IDashboardItemInput) {
    const dashboardItem = await DashboardItems.addDashboardItem({ ...doc });

    return dashboardItem;
  },

  async dashboardItemEdit(_root, { _id, ...fields }: IDashboardItemEdit) {
    const updated = await DashboardItems.editDashboardItem(_id, fields);

    return updated;
  },

  async dashboardItemRemove(_root, { _id }: { _id: string }) {
    const updated = await DashboardItems.remove(_id);

    return updated;
  },
};

checkPermission(dashboardsMutations, 'dashboardItemAdd', 'dashboardItemAdd');
checkPermission(dashboardsMutations, 'dashboardItemEdit', 'dashboardItemEdit');
checkPermission(dashboardsMutations, 'dashboardItemRemove', 'dashboardItemRemove');
checkPermission(dashboardsMutations, 'dashboardAdd', 'dashboardAdd');
checkPermission(dashboardsMutations, 'dashboardEdit', 'dashboardEdit');
checkPermission(dashboardsMutations, 'dashboardRemove', 'dashboardRemove');

export default dashboardsMutations;
