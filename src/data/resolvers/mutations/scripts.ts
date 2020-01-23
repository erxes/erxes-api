import { Scripts } from '../../../db/models';
import { IScript } from '../../../db/models/definitions/scripts';
import { MODULE_NAMES } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherScriptFieldNames, LogDesc } from './logUtils';

interface IScriptsEdit extends IScript {
  _id: string;
}

const scriptMutations = {
  /**
   * Creates a new script
   */
  async scriptsAdd(_root, doc: IScript, { user, docModifier }: IContext) {
    const modifiedDoc = docModifier(doc);
    const script = await Scripts.createScript(modifiedDoc);

    const extraDesc: LogDesc[] = await gatherScriptFieldNames(script);

    await putCreateLog(
      {
        type: MODULE_NAMES.SCRIPT,
        newData: JSON.stringify(modifiedDoc),
        object: script,
        description: `"${script.name}" has been created`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return script;
  },

  /**
   * Updates a script
   */
  async scriptsEdit(_root, { _id, ...fields }: IScriptsEdit, { user }: IContext) {
    const script = await Scripts.getScript(_id);
    const updated = await Scripts.updateScript(_id, fields);

    let extraDesc: LogDesc[] = await gatherScriptFieldNames(script);

    extraDesc = await gatherScriptFieldNames(updated, extraDesc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.SCRIPT,
        object: script,
        newData: JSON.stringify(fields),
        description: `"${script.name}" has been edited`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return updated;
  },

  /**
   * Deletes a script
   */
  async scriptsRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const script = await Scripts.getScript(_id);
    const removed = await Scripts.removeScript(_id);

    const extraDesc: LogDesc[] = await gatherScriptFieldNames(script);

    await putDeleteLog(
      {
        type: MODULE_NAMES.SCRIPT,
        object: script,
        description: `"${script.name}" has been removed`,
        extraDesc: JSON.stringify(extraDesc),
      },
      user,
    );

    return removed;
  },
};

moduleCheckPermission(scriptMutations, 'manageScripts');

export default scriptMutations;
