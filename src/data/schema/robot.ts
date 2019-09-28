export const types = `
  type RobotEntry {
    action: String
    data: JSON
  }

  type OnboardingGetAvailableFeaturesResponse {
    name: String
    actions: [String]
    showActions: Boolean
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
  onboardingCheckStatus: String
  onboardingForceComplete: JSON
`;
