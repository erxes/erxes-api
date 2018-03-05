import mongoose from 'mongoose';
import { field } from './utils';
import { ActionsMap } from '../../data/permissions/utils';

const EntrySchema = mongoose.Schema({
  _id: field({ pkey: true }),
  module: field({ type: String }),
  action: field({ type: String }),
  userId: field({ type: String }),
  requiredActions: field({ type: [String] }),
  allowed: field({ type: Boolean, default: false }),
});

class Permission {
  /**
   * Create a permission
   * @param  {Object} doc object
   * @return {Promise} Newly created permission object
   */
  static async createPermission(doc) {
    const permissions = [];

    for (let action of doc.actions) {
      if (!ActionsMap[action]) throw new Error('Invalid data');
    }

    let filter = {};
    let entry = {};
    let actionObj = {};

    for (let action of doc.actions) {
      entry = {
        action,
        module: doc.module,
        allowed: doc.allowed,
      };

      actionObj = ActionsMap[action];

      if (actionObj.use) {
        entry.requiredActions = actionObj.use;
      }

      for (let userId of doc.userIds) {
        filter = { action, userId };

        const entryObj = await Permissions.findOne(filter);

        if (!entryObj) {
          const newEntry = await this.create({ ...entry, userId });
          permissions.push(newEntry);
        }
      }
    }

    return permissions;
  }

  /**
   * Delete permission
   * @param  {[string]} ids
   * @return {Promise}
   */
  static async removePermission(ids) {
    const count = await Permissions.find({ _id: { $in: ids } }).count();

    if (count !== ids.length) throw new Error('Permission not found');

    return Permissions.remove({ _id: { $in: ids } });
  }
}

EntrySchema.loadClass(Permission);

const Permissions = mongoose.model('permissions_entries', EntrySchema);

export default Permissions;
