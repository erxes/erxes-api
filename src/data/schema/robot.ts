export const types = `
  type RobotEntry {
    action: String
    data: JSON
  }

  type OnboaringFeature {
    name: String
    text: String
  }

  type OnboardingNotification {
    userId: String
    action: String
  }
`;

export const queries = `
  robotEntries: [RobotEntry]
  onboardingActionsCompleteness(actions: [String]): JSON
  onboardingGetAvailableFeatures: [OnboaringFeature]
`;
