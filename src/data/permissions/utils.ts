import { Permissions, Users } from '../../db/models';

export interface IModulesMap {
  name: string;
  description?: string;
  actions?: IActionsMap[];
}

export interface IActionsMap {
  name?: string;
  module?: string;
  description?: string;
  use?: string[];
}

// Schema: {name: description}
// tslint:disable-next-line
export const ModulesMap: IModulesMap[] = [];

/*
Schema:
  {
    name: {
      module: '', // module name
      description: '', // human friendly description
      use: [<action_names>] // Optional: required actions
    }
  }
*/
// tslint:disable-next-line
export const ActionsMap: IActionsMap = {};

export const registerModule = (modules: any): void => {
  const moduleKeys = Object.keys(modules);

  for (const key of moduleKeys) {
    const module = modules[key];

    if (!module.actions) {
      throw new Error(`Actions not found in module`);
    }

    // check module, actions duplicate
    if (ModulesMap[module.name]) {
      throw new Error(`"${module.name}" module has been registered`);
    }

    if (module.actions) {
      for (const action of module.actions) {
        if (!action.name) {
          throw new Error(`Action name is missing`);
        }

        if (ActionsMap[action.name]) {
          throw new Error(`"${action.name}" action has been registered`);
        }
      }
    }

    // save
    ModulesMap[module.name] = module.description;

    if (module.actions) {
      for (const action of module.actions) {
        if (!action.name) {
          throw new Error('Action name is missing');
        }

        ActionsMap[action.name] = {
          module: module.name,
          description: action.description,
        };

        if (action.use) {
          ActionsMap[action.name].use = action.use;
        }
      }
    }
  }
};

export const can = async (action: string, userId: string = ''): Promise<boolean> => {
  if (!userId) {
    return false;
  }

  const user = await Users.findOne({ _id: userId }).select({
    isOwner: 1,
    groupIds: 1,
  });

  if (!user) {
    return false;
  }

  if (user.isOwner) {
    return true;
  }

  let allowed = false;

  let entries = await Permissions.find({
    userId,
    $or: [{ action }, { requiredActions: action }],
  }).select('allowed');

  entries.every(e => {
    if (e.allowed) {
      allowed = true;
      return false;
    }

    return true;
  });

  if (!allowed && user.groupIds) {
    entries = await Permissions.find({
      groupId: { $in: user.groupIds },
      $or: [{ action }, { requiredActions: action }],
    }).select('allowed');

    entries.every(e => {
      if (e.allowed) {
        allowed = true;
        return false;
      }

      return true;
    });
  }

  return allowed;
};
