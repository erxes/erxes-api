import { RobotEntries } from '../../../db/models';
import { OnboardingHistories } from '../../../db/models/Robot';
import { moduleObjects } from '../../permissions/actions/permission';
import { getUserAllowedActions, IModuleMap } from '../../permissions/utils';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { IContext } from '../../types';

const features: { [key: string]: { settings: string[]; settingsPermissions: string[] } } = {
  inbox: {
    settings: ['brandCreate', 'channelCreate', 'integrationCreate'],
    settingsPermissions: ['manageBrands', 'manageChannels', 'integrationCreate'],
  },
  customers: { settings: [], settingsPermissions: [] },
  deals: {
    settings: ['boardCreate', 'pipelineCreate', 'dealCreate'],
    settingsPermissions: ['dealBoardsAdd', 'dealPipelinesAdd', 'dealStagesAdd'],
  },
  tasks: {
    settings: ['boardCreate', 'pipelineCreate', 'taskCreate'],
    settingsPermissions: ['taskBoardsAdd', 'taskPipelinesAdd', 'taskStagesAdd'],
  },
  tickets: {
    settings: ['boardCreate', 'pipelineCreate', 'ticketCreate'],
    settingsPermissions: ['ticketBoardsAdd', 'ticketPipelinesAdd', 'ticketStagesAdd'],
  },
  growthHacks: {
    settings: ['boardCreate', 'pipelineCreate', 'growthHackCreate'],
    settingsPermissions: ['growthHackBoardsAdd', 'growthHackPipelinesAdd', 'growthHackStagesAdd'],
  },
  engages: {
    settings: ['emailTemplateCreate', 'tagCreate'],
    settingsPermissions: ['manageEmailTemplate', 'manageTags'],
  },
  leads: {
    settings: ['brandCreate'],
    settingsPermissions: ['manageBrands'],
  },
  knowledgeBase: {
    settings: ['knowledgeBaseTopicCreate', 'knowledgeBaseCategoryCreate', 'knowledgeBaseArticleCreate'],
    settingsPermissions: ['manageKnowledgeBase'],
  },
  tags: {
    settings: [],
    settingsPermissions: [],
  },
  insights: {
    settings: [],
    settingsPermissions: [],
  },
  importHistories: {
    settings: [],
    settingsPermissions: [],
  },
  segments: {
    settings: [],
    settingsPermissions: [],
  },
  properties: {
    settings: [],
    settingsPermissions: [],
  },
  permissions: {
    settings: [],
    settingsPermissions: [],
  },
  integrations: {
    settings: ['brandCreate', 'channelCreate'],
    settingsPermissions: ['manageBrands', 'manageChannels'],
  },
};

const checkShowModule = (actionsMap, moduleName: string): { showModule: boolean; showSettings: boolean } => {
  const module: IModuleMap = moduleObjects[moduleName];

  let showModule = false;
  let showSettings = true;

  for (const action of module.actions || []) {
    if (actionsMap.includes(action.name || '')) {
      showModule = true;
      break;
    }
  }

  for (const permission of features[moduleName].settingsPermissions) {
    if (actionsMap.includes(permission)) {
      showSettings = false;
      break;
    }
  }

  return {
    showModule,
    showSettings,
  };
};

const robotQueries = {
  robotEntries(_root) {
    return RobotEntries.find();
  },

  onboardingStepsCompleteness(_root, { steps }: { steps: string[] }, { user }: IContext) {
    return OnboardingHistories.stepsCompletness(steps, user);
  },

  async onboardingGetAvailableFeatures(_root, _args, { user }: IContext) {
    const results: Array<{ name: string; isComplete: boolean; settings?: string[]; showSettings?: boolean }> = [];
    const actionsMap = await getUserAllowedActions(user);

    for (const feature of Object.keys(features)) {
      const { settings } = features[feature];

      if (['leads', 'properties'].includes(feature)) {
        const selector = { userId: user._id, completedSteps: { $all: [`${feature}Show`] } };
        const isComplete = (await OnboardingHistories.find(selector).countDocuments()) > 0;

        if (actionsMap.includes('integrationsCreateLeadIntegration')) {
          results.push({
            name: feature,
            settings,
            isComplete,
          });
        }

        if (actionsMap.includes('manageForms')) {
          results.push({
            name: feature,
            settings,
            isComplete,
          });
        }

        continue;
      }

      const { showModule, showSettings } = checkShowModule(actionsMap, feature);

      if (showModule) {
        const selector = { userId: user._id, completedSteps: { $all: [`${feature}Show`, ...settings] } };

        results.push({
          name: feature,
          settings,
          showSettings,
          isComplete: (await OnboardingHistories.find(selector).countDocuments()) > 0,
        });
      }
    }

    return results;
  },
};

moduleRequireLogin(robotQueries);

export default robotQueries;
