import { Brands, Integrations, Stages, Users } from '../../db/models';
import { IActivityLog } from '../../db/models/definitions/activityLogs';
import { ACTIVITY_ACTIONS } from '../../db/models/definitions/constants';

export default {
  async createdByDetail(activityLog: IActivityLog) {
    const user = await Users.findOne({ _id: activityLog.createdBy });

    if (user) {
      return user;
    }

    const integration = await Integrations.findOne({ _id: activityLog.createdBy });

    if (integration) {
      const brand = await Brands.findOne({ _id: integration.brandId });

      return brand;
    }

    return;
  },

  async contentDetail(activityLog: IActivityLog) {
    const { action } = activityLog;

    if (action === ACTIVITY_ACTIONS.MOVED) {
      const { content } = activityLog;

      const { oldStageId, destinationStageId } = content;

      const destinationStage = await Stages.getStage(destinationStageId);
      const oldStage = await Stages.getStage(oldStageId);

      if (destinationStage && oldStage) {
        return `moved deal from ${oldStage.name} to ${destinationStage.name}`;
      }

      return content.text;
    }
  },
};
