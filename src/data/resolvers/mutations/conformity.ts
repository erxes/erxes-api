import { Conformities } from '../../../db/models';
import { IConformityAdd, IConformityCreate } from '../../../db/models/definitions/conformity';
const conformityMutations = {
  /**
   * Create new deal
   */
  async conformityAdd(_root, doc: IConformityAdd) {
    return Conformities.addConformity({ ...doc });
  },

  async conformityCreate(_root, doc: IConformityCreate) {
    return Conformities.createConformity({ ...doc });
  },
};

export default conformityMutations;
