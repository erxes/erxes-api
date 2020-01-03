import { Scripts } from '../../../db/models';
import { IScript } from '../../../db/models/definitions/scripts';
import { MODULE_NAMES } from '../../constants';
import { moduleCheckPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { gatherBrandNames, gatherIntegrationNames, gatherKbTopicNames, LogDesc } from './logUtils';

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

    let extraDesc: LogDesc[] = [];

    if (doc.messengerId) {
      extraDesc = await gatherIntegrationNames({
        idFields: [doc.messengerId],
        foreignKey: 'messengerId',
      });
    }

    if (doc.kbTopicId) {
      extraDesc = await gatherKbTopicNames({
        idFields: [doc.kbTopicId],
        foreignKey: 'kbTopicId',
        prevList: extraDesc,
      });
    }

    if (doc.leadIds && doc.leadIds.length > 0) {
      extraDesc = await gatherIntegrationNames({
        idFields: doc.leadIds,
        foreignKey: 'leadIds',
        prevList: extraDesc,
      });
    }

    if (modifiedDoc.scopeBrandIds && modifiedDoc.scopeBrandIds.length > 0) {
      extraDesc = await gatherBrandNames({
        idFields: modifiedDoc.scopeBrandIds,
        foreignKey: 'scopeBrandIds',
        prevList: extraDesc,
      });
    }

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

    const { messengerId, kbTopicId, leadIds } = fields;

    let extraDesc: LogDesc[] = [];

    if (script.scopeBrandIds && script.scopeBrandIds.length > 0) {
      extraDesc = await gatherBrandNames({
        idFields: script.scopeBrandIds,
        foreignKey: 'scopeBrandIds',
      });
    }

    // gather unique messenger ids
    const msngrIds: string[] = [];

    if (script.messengerId) {
      msngrIds.push(script.messengerId);
    }

    if (messengerId && messengerId !== script.messengerId) {
      msngrIds.push(messengerId);
    }

    if (msngrIds.length > 0) {
      extraDesc = await gatherIntegrationNames({
        idFields: msngrIds,
        foreignKey: 'messengerId',
        prevList: extraDesc,
      });
    }

    // gather unique kb topics
    const kbTopicIds: string[] = [];

    if (script.kbTopicId) {
      kbTopicIds.push(script.kbTopicId);
    }

    if (kbTopicId && kbTopicId !== script.kbTopicId) {
      kbTopicIds.push(kbTopicId);
    }

    if (kbTopicIds.length > 0) {
      extraDesc = await gatherKbTopicNames({
        idFields: kbTopicIds,
        foreignKey: 'kbTopicId',
        prevList: extraDesc,
      });
    }

    // gather unique lead integrations
    let leads: string[] = script.leadIds || [];

    if (leadIds && leadIds.length > 0) {
      leads = leads.concat(leadIds);
    }

    if (leads.length > 0) {
      extraDesc = await gatherIntegrationNames({
        idFields: leads,
        foreignKey: 'leadIds',
        prevList: extraDesc,
      });
    }

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

    let extraDesc: LogDesc[] = [];

    if (script.messengerId) {
      extraDesc = await gatherIntegrationNames({
        idFields: [script.messengerId],
        foreignKey: 'messengerId',
      });
    }

    if (script.kbTopicId) {
      extraDesc = await gatherKbTopicNames({
        idFields: [script.kbTopicId],
        foreignKey: 'kbTopicId',
        prevList: extraDesc,
      });
    }

    if (script.leadIds && script.leadIds.length > 0) {
      extraDesc = await gatherIntegrationNames({
        idFields: script.leadIds,
        foreignKey: 'leadIds',
        prevList: extraDesc,
      });
    }

    if (script.scopeBrandIds && script.scopeBrandIds.length > 0) {
      extraDesc = await gatherBrandNames({
        idFields: script.scopeBrandIds,
        foreignKey: 'scopeBrandIds',
        prevList: extraDesc,
      });
    }

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
