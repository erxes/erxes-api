import { DashboardItems, Dashboards } from '../../../db/models';
import { IDashboard, IDashboardItemInput } from '../../../db/models/definitions/dashboard';

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
    const dashboardItem = await DashboardItems.create({ ...doc });

    return dashboardItem;
  },

  async dashboardItemEdit(_root, { _id, ...fields }: IDashboardItemEdit) {
    const updated = await DashboardItems.update(_id, fields);

    return updated;
  },
};

export default dashboardsMutations;
