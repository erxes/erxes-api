import { DashboardItems } from '../../../db/models';
import { IDashboardItemInput } from '../../../db/models/definitions/dashboard';

interface IDashboardItemEdit extends IDashboardItemInput {
  _id: string;
}

const dashboardsMutations = {
  /**
   * Create new brand
   */
  async createDashboardItem(_root, doc: IDashboardItemInput) {
    const dashboardItem = await DashboardItems.create({ ...doc });

    return dashboardItem;
  },

  /**
   * Update brand
   */
  async updateDashboardItem(_root, { _id, ...fields }: IDashboardItemEdit) {
    const updated = await DashboardItems.update(_id, fields);

    return updated;
  },
};

export default dashboardsMutations;
