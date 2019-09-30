export const types = `
  type RobotEntry {
    action: String
    data: JSON
  }

  type OnboardingGetAvailableFeaturesResponse {
    name: String
    settings: [String]
    showSettings: Boolean
    isComplete: Boolean
  }

  type OnboardingNotification {
    userId: String
    type: String
  }
`;

export const queries = `
  robotEntries(isNotified: Boolean): [RobotEntry]
  onboardingStepsCompleteness(steps: [String]): JSON
  onboardingGetAvailableFeatures: [OnboardingGetAvailableFeaturesResponse]
`;

export const mutations = `
  onboardingCheckStatus: String
  onboardingForceComplete: JSON
  onboardingCompleteShowStep(step: String): JSON
`;
