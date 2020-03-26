import { Model, model } from 'mongoose';
import { dashboardItemSchema, IDashboardItemDocument, IDashboardItemInput } from './definitions/dashboard';

export interface IDashboardItemModel extends Model<IDashboardItemDocument> {
  addDashboardItem(doc: IDashboardItemInput): Promise<IDashboardItemDocument>;
  removeDashboardItem(_id: string): void;
}

export const loadClass = () => {
  class DashboardItem {
    public static addDashboardItem(doc: IDashboardItemInput) {
      return DashboardItems.create(doc);
    }

    public static async removeDashboardItem(_id: string) {
      await DashboardItems.remove(_id);
    }
  }

  dashboardItemSchema.loadClass(DashboardItem);

  return dashboardItemSchema;
};

loadClass();

// tslint:disable-next-line
const DashboardItems = model<IDashboardItemDocument, IDashboardItemModel>('dashboard_items', dashboardItemSchema);

export { DashboardItems };
