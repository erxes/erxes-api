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

  type RobotJobType {
    name: String
    notificationsCount: Int
  }

  type RobotJob {
    _id: String
    content: String
    isNotified: Boolean
  }
`;

export const queries = `
  robotGetJobTypes: [RobotJobType]
  robotGetJobs(type: String, isNotified: Boolean, parentId: String, limit: Int): [RobotJob]
  onboardingStepsCompleteness(steps: [String]): JSON
  onboardingGetAvailableFeatures: [OnboardingGetAvailableFeaturesResponse]
`;

export const mutations = `
  onboardingCheckStatus: String
  onboardingForceComplete: JSON
  onboardingCompleteShowStep(step: String): JSON
`;
