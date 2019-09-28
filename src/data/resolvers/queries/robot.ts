import { RobotEntries } from '../../../db/models';
import { OnboardingHistories } from '../../../db/models/Robot';
import { moduleObjects } from '../../permissions/actions/permission';
import { getUserAllowedActions, IModuleMap } from '../../permissions/utils';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

const featureActions: { [key: string]: string[] } = {
  inbox: ['manageBrands', 'manageChannels', 'integrationCreate'],
  customers: [],
  deals: ['dealBoardsAdd', 'dealPipelinesAdd', 'dealStagesAdd'],
  tasks: ['taskBoardsAdd', 'taskPipelinesAdd', 'taskStagesAdd'],
  tickets: ['ticketBoardsAdd', 'ticketPipelinesAdd', 'ticketStagesAdd'],
  growthHacks: ['growthHackBoardsAdd', 'growthHackPipelinesAdd', 'growthHackStagesAdd', 'managePipelineTemplates'],
  engages: ['manageEmailTemplate', 'manageTags'],
  leads: ['manageBrands'],
  knowledgeBase: ['manageKnowledgeBase'],
  tags: ['manageTags'],
  insights: [],
  importHistories: [],
  segments: [],
  properties: [],
  permissions: [],
  integrations: ['manageBrands', 'manageChannels'],
};

const checkShowModule = (actionsMap, moduleName: string): { showModule: boolean; showActions: boolean } => {
  const actions = featureActions[moduleName];
  const module: IModuleMap = moduleObjects[moduleName];

  let showModule = false;
  let showActions = true;

  for (const action of module.actions || []) {
    if (actionsMap.includes(action.name || '')) {
      showModule = true;
      break;
    }
  }

  for (const action of actions) {
    if (actionsMap.includes(action)) {
      showActions = false;
      break;
    }
  }

  return {
    showModule,
    showActions,
  };
};

const robotQueries = {
  robotEntries(_root) {
    return RobotEntries.find();
  },

  onboardingActionsCompleteness(_root, { actions }: { actions: string[] }, { user }: IContext) {
    return OnboardingHistories.actionsCompletness(actions, user);
  },

  async onboardingGetAvailableFeatures(_root, _args, { user }: IContext) {
    const results: Array<{ name: string; isComplete: boolean; actions?: string[]; showActions?: boolean }> = [];
    const actionsMap = await getUserAllowedActions(user);

    for (const feature of Object.keys(featureActions)) {
      if (['leads', 'properties'].includes(feature)) {
        const selector = { userId: user._id, completedActions: { $all: [`${feature}Show`] } };
        const isComplete = (await OnboardingHistories.find(selector).countDocuments()) > 0;

        if (actionsMap.includes('integrationsCreateLeadIntegration')) {
          results.push({
            name: feature,
            isComplete,
          });
        }

        if (actionsMap.includes('manageForms')) {
          results.push({
            name: feature,
            isComplete,
          });
        }

        continue;
      }

      const { showModule, showActions } = checkShowModule(actionsMap, feature);

      if (showModule) {
        const actions = featureActions[feature] || [];
        const selector = { userId: user._id, completedActions: { $all: [`${feature}Show`, ...actions] } };

        results.push({
          name: feature,
          actions,
          showActions,
          isComplete: (await OnboardingHistories.find(selector).countDocuments()) > 0,
        });
      }
    }

    return results;
  },
};

moduleRequireLogin(robotQueries);

export default robotQueries;
