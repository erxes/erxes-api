export const types = `
  type RobotEntry {
    action: String
    data: JSON
  }

  type OnboaringFeatureAction {
    name: String
    url: String
  }

  type OnboaringFeature {
    name: String
    text: String
    description: String
    videoUrl: String
    actions: [OnboaringFeatureAction]
  }

  type OnboardingGetAvailableFeaturesResponse {
    feature: OnboaringFeature
    isComplete: Boolean
  }

  type OnboardingNotification {
    userId: String
    type: String
  }
`;

export const queries = `
  robotEntries: [RobotEntry]
  onboardingActionsCompleteness(actions: [String]): JSON
  onboardingGetAvailableFeatures: [OnboardingGetAvailableFeaturesResponse]
`;

export const mutations = `
  onboardingForceComplete: JSON
`;
