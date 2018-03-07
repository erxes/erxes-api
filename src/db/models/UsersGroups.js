import mongoose from 'mongoose';
import { field } from './utils';

const GroupSchema = mongoose.Schema({
  _id: field({ pkey: true }),
  name: field({ type: String, unique: true }),
  description: field({ type: String }),
});

class Group {
  /**
   * Create a group
   * @param  {Object} doc
   * @return {Promise} Newly created group object
   */
  static async createGroup(doc) {
    return this.create(doc);
  }

  /**
   * Update Group
   * @param  {Object} doc
   * @return {Promise} updated group object
   */
  static async updateGroup(_id, doc) {
    await this.update({ _id }, { $set: doc });

    return this.findOne({ _id });
  }

  /**
   * Remove Group
   * @param  {String} _id
   * @return {Promise}
   */
  static async removeGroup(_id) {
    const groupObj = await UsersGroups.findOne({ _id });

    if (!groupObj) throw new Error(`Group not found with id ${_id}`);

    return groupObj.remove();
  }
}

GroupSchema.loadClass(Group);
const UsersGroups = mongoose.model('users_groups', GroupSchema);

export default UsersGroups;
