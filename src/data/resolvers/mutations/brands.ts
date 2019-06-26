import { Brands } from '../../../db/models';
import { IBrand, IBrandEmailConfig } from '../../../db/models/definitions/brands';
import { ACTIVITY_ACTIONS, ACTIVITY_TYPES } from '../../../db/models/definitions/constants';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { fetchLogsApi, getChangedFields, prepareLogRequest } from '../../utils';

interface IBrandsEdit extends IBrand {
  _id: string;
}

const brandMutations = {
  /**
   * Create new brand
   */
  async brandsAdd(_root, doc: IBrand, { user }: { user: IUserDocument }) {
    const brand = await Brands.createBrand({ userId: user._id, ...doc });
    const logDoc = prepareLogRequest({
      createdBy: user._id,
      type: ACTIVITY_TYPES.BRAND,
      action: ACTIVITY_ACTIONS.CREATE,
      oldData: '',
      content: JSON.stringify(doc),
      objectId: brand._id,
      objectName: doc.name,
    });

    try {
      await fetchLogsApi(logDoc);
    } catch (e) {
      throw new Error(e);
    }

    return brand;
  },

  /**
   * Update brand
   */
  async brandsEdit(_root, { _id, ...fields }: IBrandsEdit, { user }: { user: IUserDocument }) {
    const brand = await Brands.findOne({ _id });
    const updated = await Brands.updateBrand(_id, fields);

    if (updated && updated._id) {
      const comparison = getChangedFields(brand, fields);
      const logDoc = prepareLogRequest({
        createdBy: user._id,
        type: ACTIVITY_TYPES.BRAND,
        action: ACTIVITY_ACTIONS.UPDATE,
        oldData: JSON.stringify(comparison.unchanged),
        content: JSON.stringify(comparison.changed),
        objectId: _id,
        objectName: updated.name,
      });

      try {
        await fetchLogsApi(logDoc);
      } catch (e) {
        throw new Error(e);
      }
    }

    return updated;
  },

  /**
   * Delete brand
   */
  async brandsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const found = await Brands.findOne({ _id });
    const removed = await Brands.removeBrand(_id);

    if (found && removed) {
      const logDoc = prepareLogRequest({
        createdBy: user._id,
        type: ACTIVITY_TYPES.BRAND,
        action: ACTIVITY_ACTIONS.DELETE,
        oldData: JSON.stringify(found),
        content: '',
        objectId: _id,
        objectName: found.name,
      });

      try {
        await fetchLogsApi(logDoc);
      } catch (e) {
        throw new Error(e);
      }
    }

    return removed;
  },

  /**
   * Update brands email config
   */
  async brandsConfigEmail(_root, { _id, emailConfig }: { _id: string; emailConfig: IBrandEmailConfig }) {
    return Brands.updateEmailConfig(_id, emailConfig);
  },

  /**
   * Update brandId fields in given Integrations
   */
  async brandsManageIntegrations(_root, { _id, integrationIds }: { _id: string; integrationIds: string[] }) {
    return Brands.manageIntegrations({ _id, integrationIds });
  },
};

moduleCheckPermission(brandMutations, 'manageBrands');

export default brandMutations;
