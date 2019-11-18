export const types = `
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

  type RobotJob {
    _id: String
    content: String
  }
`;

export const queries = `
  robotGetJobs(type: String, isNotified: Boolean, parentId: String, limit: Int): [RobotJob]
  onboardingStepsCompleteness(steps: [String]): JSON
  onboardingGetAvailableFeatures: [OnboardingGetAvailableFeaturesResponse]
`;

export const mutations = `
  robotMarkJobAsNotified(_id: String): [RobotJob]
  onboardingCheckStatus: String
  onboardingForceComplete: JSON
  onboardingCompleteShowStep(step: String): JSON
`;
