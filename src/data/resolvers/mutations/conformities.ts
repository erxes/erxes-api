import { Conformities } from '../../../db/models';
import { IConformityAdd, IConformityEdit } from '../../../db/models/definitions/conformities';
import { graphqlPubsub } from '../../../pubsub';

const conformityMutations = {
  /**
   * Create new conformity
   */
  async conformityAdd(_root, doc: IConformityAdd) {
    graphqlPubsub.publish('activityLogsChanged', { activityLogsChanged: true });

    return Conformities.addConformity({ ...doc });
  },

  /**
   * Edit conformity
   */
  async conformityEdit(_root, doc: IConformityEdit) {
    graphqlPubsub.publish('activityLogsChanged', { activityLogsChanged: true });

    return Conformities.editConformity({ ...doc });
  },
};

export default conformityMutations;
