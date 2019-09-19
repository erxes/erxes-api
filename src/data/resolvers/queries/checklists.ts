import { Checklists } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';

const checklistQueries = {
  /**
   * Checklists list
   */
  checklists(_root, { contentType, contentTypeId }: { contentType: string; contentTypeId: string }) {
    return Checklists.find({ contentType, contentTypeId }).sort({
      createdDate: 1,
    });
  },
};

moduleRequireLogin(checklistQueries);

export default checklistQueries;
