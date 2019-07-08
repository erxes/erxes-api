import { Brands } from '../../../db/models';
import { IBrand, IBrandEmailConfig } from '../../../db/models/definitions/brands';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

interface IBrandsEdit extends IBrand {
  _id: string;
}

const brandMutations = {
  /**
   * Create new brand
   */
  async brandsAdd(_root, doc: IBrand, { user }: { user: IUserDocument }) {
    const brand = await Brands.createBrand({ userId: user._id, ...doc });

    await putCreateLog(
      {
        type: 'brand',
        newData: JSON.stringify(doc),
        objectId: brand._id,
        description: `${doc.name} has been created`,
      },
      user,
    );

    return brand;
  },

  /**
   * Update brand
   */
  async brandsEdit(_root, { _id, ...fields }: IBrandsEdit, { user }: { user: IUserDocument }) {
    const brand = await Brands.findOne({ _id });
    const updated = await Brands.updateBrand(_id, fields);

    if (brand) {
      await putUpdateLog(
        {
          type: 'brand',
          oldData: JSON.stringify(brand),
          newData: JSON.stringify(fields),
          objectId: _id,
          description: `${fields.name} has been edited`,
        },
        user,
      );
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
      await putDeleteLog(
        {
          type: 'brand',
          oldData: JSON.stringify(found),
          objectId: _id,
          description: `${found.name} has been removed`,
        },
        user,
      );
    }

    return removed;
  },

  /**
   * Update brands email config
   */
  async brandsConfigEmail(
    _root,
    { _id, emailConfig }: { _id: string; emailConfig: IBrandEmailConfig },
    { user }: { user: IUserDocument },
  ) {
    const found = await Brands.findOne({ _id });
    const updated = await Brands.updateEmailConfig(_id, emailConfig);

    if (found) {
      await putUpdateLog(
        {
          type: 'brand',
          oldData: JSON.stringify(found),
          objectId: _id,
          description: `${found.name} email config has been changed`,
        },
        user,
      );
    }

    return updated;
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
