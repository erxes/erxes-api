import { DashboardItems, Dashboards } from '../../../db/models';
import { IDashboard, IDashboardItemInput } from '../../../db/models/definitions/dashboard';

interface IDashboardItemEdit extends IDashboardItemInput {
  _id: string;
}

const dashboardsMutations = {
  async dashboardAdd(_root, doc: IDashboard) {
    const dashboard = await Dashboards.create({ ...doc });

    return dashboard;
  },

  async createDashboardItem(_root, doc: IDashboardItemInput) {
    const dashboardItem = await DashboardItems.create({ ...doc });

    return dashboardItem;
  },

  async updateDashboardItem(_root, { _id, ...fields }: IDashboardItemEdit) {
    const updated = await DashboardItems.update(_id, fields);

    return updated;
  },
};

export default dashboardsMutations;
