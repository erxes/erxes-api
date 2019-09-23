export const types = `
  type RobotEntry {
    action: String
    data: JSON
  }

  type RobotOnboaringFeature {
    name: String
    text: String
  }

  type OnboardingNotification {
    type: String
  }
`;

export const queries = `
  robotEntries: [RobotEntry]
  robotSettingsCompleteness(settingNames: [String]): JSON
  robotOnboardingGetAvailableFeatures: [RobotOnboaringFeature]
`;
