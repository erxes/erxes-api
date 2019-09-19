import { Users } from '../../db/models';
import { IPipelineDocument } from '../../db/models/definitions/boards';
import { PIPELINE_VISIBLITIES } from '../../db/models/definitions/constants';
import { IContext } from '../types';

export default {
  members(pipeline: IPipelineDocument, {}) {
    if (pipeline.visibility === PIPELINE_VISIBLITIES.PRIVATE) {
      return Users.find({ _id: { $in: pipeline.memberIds } });
    }

    return [];
  },

  isWatched(pipeline: IPipelineDocument, _args, { user }: IContext) {
    const watchedUserIds = pipeline.watchedUserIds || [];

    if (watchedUserIds.includes(user._id)) {
      return true;
    }

    return false;
  },

  state(pipeline: IPipelineDocument) {
    if (pipeline.startDate && pipeline.endDate) {
      const now = new Date().getTime();

      const startDate = new Date(pipeline.startDate).getTime();
      const endDate = new Date(pipeline.endDate).getTime();

      if (now > endDate) {
        return 'Completed';
      } else if (now < endDate && now > startDate) {
        return 'In progress';
      } else {
        return 'Not started';
      }
    }

    return '';
  },
};
