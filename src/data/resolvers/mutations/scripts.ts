import { Scripts } from '../../../db/models';
import { IScript } from '../../../db/models/definitions/scripts';
import { IUserDocument } from '../../../db/models/definitions/users';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';

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
      await putCreateLog(
        {
          type: 'script',
          newData: JSON.stringify(doc),
          object: JSON.stringify(script),
          description: `${script.name} has been created`,
        },
        user,
      );
    }

    return script;
  },

  /**
   * Update script
   */
  async scriptsEdit(_root, { _id, ...fields }: IScriptsEdit, { user }: { user: IUserDocument }) {
    const script = await Scripts.findOne({ _id });
    const updated = await Scripts.updateScript(_id, fields);

    if (script) {
      await putUpdateLog(
        {
          type: 'script',
          object: JSON.stringify(script),
          newData: JSON.stringify(fields),
          description: `${script.name} has been edited`,
        },
        user,
      );
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
      await putDeleteLog(
        {
          type: 'script',
          object: JSON.stringify(script),
          description: `${script.name} has been removed`,
        },
        user,
      );
    }

    return removed;
  },
};

moduleCheckPermission(scriptMutations, 'manageScripts');

export default scriptMutations;
