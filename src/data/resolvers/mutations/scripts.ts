import { Scripts } from '../../../db/models';
import { IScript } from '../../../db/models/definitions/scripts';
import { MODULE_NAMES } from '../../constants';
import { gatherScriptFieldNames, LogDesc, putCreateLog, putDeleteLog, putUpdateLog } from '../../logUtils';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';

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
        newData: modifiedDoc,
        object: script,
        description: `"${script.name}" has been created`,
        extraDesc,
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
        newData: fields,
        description: `"${script.name}" has been edited`,
        extraDesc,
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
        extraDesc,
      },
      user,
    );

    return removed;
  },
};

moduleCheckPermission(scriptMutations, 'manageScripts');

export default scriptMutations;
