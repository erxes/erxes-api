import { Scripts } from '../../../db/models';
import { IScript } from '../../../db/models/definitions/scripts';
import { IUserDocument } from '../../../db/models/definitions/users';
import { LOG_ACTIONS } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putLog } from '../../utils';

interface IScriptsEdit extends IScript {
  _id: string;
}

const scriptMutations = {
  /**
   * Create new script
   */
  async scriptsAdd(_root, doc: IScript, { user }: { user: IUserDocument }) {
    const script = await Scripts.createScript(doc);

    if (script) {
      await putLog({
        createdBy: user._id,
        type: 'script',
        action: LOG_ACTIONS.CREATE,
        newData: JSON.stringify(doc),
        objectId: script._id,
        unicode: user.username || user.email || user._id,
        description: `${script.name} has been created`,
      });
    }

    return script;
  },

  /**
   * Update script
   */
  async scriptsEdit(_root, { _id, ...fields }: IScriptsEdit, { user }: { user: IUserDocument }) {
    const script = await Scripts.findOne({ _id });
    const updated = await Scripts.updateScript(_id, fields);

    if (script && updated) {
      await putLog({
        createdBy: user._id,
        type: 'script',
        action: LOG_ACTIONS.UPDATE,
        oldData: JSON.stringify(script),
        newData: JSON.stringify(fields),
        objectId: _id,
        unicode: user.username || user.email || user._id,
        description: `${script.name} has been edited`,
      });
    }

    return updated;
  },

  /**
   * Delete script
   */
  async scriptsRemove(_root, { _id }: { _id: string }, { user }: { user: IUserDocument }) {
    const script = await Scripts.findOne({ _id });
    const removed = await Scripts.removeScript(_id);

    if (script) {
      await putLog({
        createdBy: user._id,
        type: 'script',
        action: LOG_ACTIONS.DELETE,
        oldData: JSON.stringify(script),
        objectId: _id,
        unicode: user.username || user.email || user._id,
        description: `${script.name} has been removed`,
      });
    }

    return removed;
  },
};

moduleCheckPermission(scriptMutations, 'manageScripts');

export default scriptMutations;
