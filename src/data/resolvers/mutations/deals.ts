import { Deals } from '../../../db/models';
import { IOrderInput } from '../../../db/models/Deals';
import { IDeal } from '../../../db/models/definitions/deals';
import { IUserDocument } from '../../../db/models/definitions/users';
import { checkPermission } from '../../permissions';

interface IDealsEdit extends IDeal {
  _id: string;
}

const dealMutations = {
  /**
   * Create new deal
   */
  dealsAdd(_root, doc: IDeal, { user }: { user: IUserDocument }) {
    return Deals.createDeal({
      ...doc,
      modifiedBy: user._id,
    });
  },

  /**
   * Edit deal
   */
  dealsEdit(_root, { _id, ...doc }: IDealsEdit, { user }) {
    return Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });
  },

  /**
   * Change deal
   */
  dealsChange(_root, { _id, ...doc }: { _id: string }, { user }: { user: IUserDocument }) {
    return Deals.updateDeal(_id, {
      ...doc,
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });
  },

  /**
   * Update deal orders
   */
  dealsUpdateOrder(_root, { stageId, orders }: { stageId: string; orders: IOrderInput[] }) {
    return Deals.updateOrder(stageId, orders);
  },

  /**
   * Remove deal
   */
  dealsRemove(_root, { _id }: { _id: string }) {
    return Deals.removeDeal(_id);
  },
};

checkPermission(dealMutations, 'dealsAdd', 'dealsAdd');
checkPermission(dealMutations, 'dealsEdit', 'dealsEdit');
checkPermission(dealMutations, 'dealsUpdateOrder', 'dealsUpdateOrder');
checkPermission(dealMutations, 'dealsRemove', 'dealsRemove');

export default dealMutations;
