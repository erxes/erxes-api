export const types = `
  type RobotEntry {
    action: String
    data: JSON
  }
`;

export const queries = `
  robotEntries: [RobotEntry]
  robotSettingsCompleteness(settingNames: [String]): JSON
`;
