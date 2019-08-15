import { Conformities } from '../../../db/models';
import { IConformity, IConformityCreate } from '../../../db/models/definitions/conformity';
import { IContext } from '../../types';
import { putCreateLog } from '../../utils';

const conformityMutations = {
  /**
   * Create new deal
   */
  async conformityAdd(_root, doc: IConformity, { user }: IContext) {
    const conformity = await Conformities.addConformity({ ...doc });

    await putCreateLog(
      {
        type: 'conformity',
        newData: JSON.stringify(doc),
        object: conformity,
        description: `${conformity.mainType + '-' + conformity.relType} has been created`,
      },
      user,
    );

    return conformity;
  },

  async conformityCreate(_root, doc: IConformityCreate) {
    return Conformities.createConformity({ ...doc });
  },
};

export default conformityMutations;
