import { IContext } from '../../../connectionResolver';
import { IBrand, IBrandEmailConfig } from '../../../db/models/definitions/brands';
import { moduleRequireAdmin } from '../../permissions';

interface IBrandsEdit extends IBrand {
  _id: string;
}

const brandMutations = {
  /**
   * Create new brand
   */
  brandsAdd(_root, doc: IBrand, { user, models: { Brands } }: IContext) {
    return Brands.createBrand({ userId: user._id, ...doc });
  },

  /**
   * Update brand
   */
  brandsEdit(_root, { _id, ...fields }: IBrandsEdit, { models: { Brands } }: IContext) {
    return Brands.updateBrand(_id, fields);
  },

  /**
   * Delete brand
   */
  brandsRemove(_root, { _id }: { _id: string }, { models: { Brands } }: IContext) {
    return Brands.removeBrand(_id);
  },

  /**
   * Update brands email config
   */
  async brandsConfigEmail(
    _root,
    { _id, emailConfig }: { _id: string; emailConfig: IBrandEmailConfig },
    { models: { Brands } }: IContext,
  ) {
    return Brands.updateEmailConfig(_id, emailConfig);
  },

  /**
   * Update brandId fields in given Integrations
   */
  async brandsManageIntegrations(
    _root,
    { _id, integrationIds }: { _id: string; integrationIds: string[] },
    { models: { Brands } }: IContext,
  ) {
    return Brands.manageIntegrations({ _id, integrationIds });
  },
};

moduleRequireAdmin(brandMutations);

export default brandMutations;
