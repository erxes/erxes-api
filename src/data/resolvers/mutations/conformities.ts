import { Conformities } from '../../../db/models';
import { IConformityAdd, IConformityEdit } from '../../../db/models/definitions/conformities';
import { IContext } from '../../types';
const conformityMutations = {
  /**
   * Create new conformity
   */
  async conformityAdd(_root, doc: IConformityAdd, { user }: IContext) {
    return Conformities.addConformity({ ...doc, createdBy: user._id });
  },

  /**
   * Edit conformity
   */
  async conformityEdit(_root, doc: IConformityEdit, { user }: IContext) {
    return Conformities.editConformity({ ...doc, createdBy: user._id });
  },
};

export default conformityMutations;
