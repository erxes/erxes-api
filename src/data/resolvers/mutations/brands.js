import { Brands } from '../../../db/models';

export default {
  /**
   * Create new brand
   * @return {Promise} brand object
   */
  brandsAdd(root, { code, name, description }, { user }) {
    if (user) return Brands.createBrand({ code, name, description, userId: user.id });
  },

  /**
   * Update brand
   * @return {Promise} brand object
   */
  async brandsEdit(root, { _id, code, name, description }, { user }) {
    if (user) {
      await Brands.update({ _id: _id }, { code, name, description });
      return Brands.findOne({ _id });
    }
  },

  /**
   * Delete brand
   * @return {Promise}
   */
  async brandsRemove(root, { _id }, { user }) {
    if (user) {
      const brandObj = await Brands.findOne({ _id });
      if (!brandObj) {
        throw new Error('Brand not found with id ' + _id);
      }

      return Brands.remove(_id);
    }
  },

  /**
   * Update brands email config
   * @return {Promise} brand object
   */
  async brandsConfigEmail(root, { _id, config }, { user }) {
    if (user) {
      await Brands.update(_id, { $set: { emailConfig: config } });
      return Brands.findOne({ _id });
    }
  },
};
