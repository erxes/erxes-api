import { Users } from '../../../db/models/index';

export type LogDesc = {
  [key: string]: any;
} & { name: any };

export const gatherUsernames = async (userIds: string[] = [], idFieldName: string = '') => {
  const options: LogDesc[] = [];

  for (const userId of userIds) {
    const user = await Users.findOne({ _id: userId });

    if (user) {
      options.push({ [idFieldName]: userId, name: user.username });
    }
  }

  return options;
};
