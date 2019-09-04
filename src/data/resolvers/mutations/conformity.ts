import { Conformities } from '../../../db/models';
import { IConformityAdd, IConformityEdit } from '../../../db/models/definitions/conformity';
const conformityMutations = {
  /**
   * Create new deal
   */
  async conformityAdd(_root, doc: IConformityAdd) {
    return Conformities.addConformity({ ...doc });
  },

  async conformityEdit(_root, doc: IConformityEdit) {
    return Conformities.editConformity({ ...doc });
  },
};

export default conformityMutations;
