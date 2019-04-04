import { Permissions, Users } from '../../db/models';
import { IUserDocument } from '../../db/models/definitions/users';

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
export const modulesMap: IModulesMap[] = [];

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
export const actionsMap: IActionsMap = {};

export const registerModule = (modules: any): void => {
  const moduleKeys = Object.keys(modules);

  for (const key of moduleKeys) {
    const module = modules[key];

    if (!module.actions) {
      throw new Error(`Actions not found in module`);
    }

    // check module, actions duplicate
    if (modulesMap[module.name]) {
      throw new Error(`"${module.name}" module has been registered`);
    }

    if (module.actions) {
      for (const action of module.actions) {
        if (!action.name) {
          throw new Error(`Action name is missing`);
        }

        if (actionsMap[action.name]) {
          throw new Error(`"${action.name}" action has been registered`);
        }
      }
    }

    // save
    modulesMap[module.name] = module.description;

    if (module.actions) {
      for (const action of module.actions) {
        if (!action.name) {
          throw new Error('Action name is missing');
        }

        actionsMap[action.name] = {
          module: module.name,
          description: action.description,
        };

        if (action.use) {
          actionsMap[action.name].use = action.use;
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

  const actionMap: IActionMap = await userAllowedActions(user);

  return actionMap[action] === true;
};

interface IActionMap {
  [key: string]: boolean | undefined;
}

export const userAllowedActions = async (user: IUserDocument): Promise<IActionMap> => {
  const userPermissions = await Permissions.find({ userId: user._id });
  const groupPermissions = await Permissions.find({ groupId: { $in: user.groupIds } });

  const totalPermissions = [...userPermissions, ...groupPermissions];

  const results: IActionMap = {};

  const check = (name: string, allowed?: boolean) => {
    if (typeof results[name] === 'undefined') {
      results[name] = allowed;
    }

    if (results[name] && !allowed) {
      results[name] = false;
    }
  };

  for (const { requiredActions, allowed, action } of totalPermissions) {
    if (requiredActions && requiredActions.length > 0) {
      for (const act of requiredActions) {
        check(act, allowed);
      }
    } else {
      check(action || '', allowed);
    }
  }

  return results;
};
