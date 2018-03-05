import { Users, Permissions } from '../../db/models';

// Schema: {name: description}
export const ModulesMap = {};

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
export const ActionsMap = {};

export const registerModule = module => {
  // check module, actions duplicate
  if (ModulesMap[module.name]) {
    throw new Error(`"${module.name}" module has been registered`);
  }

  for (let action of module.actions) {
    if (ActionsMap[action.name]) {
      throw new Error(`"${action.name}" action has been registered`);
    }
  }

  // save
  ModulesMap[module.name] = module.description;

  for (let action of module.actions) {
    ActionsMap[action.name] = {
      module: module.name,
      description: action.description,
    };

    if (action.use) {
      ActionsMap[action.name].use = action.use;
    }
  }
};

export const can = async (action, userId) => {
  if (!userId) {
    return false;
  }
  const user = await Users.findOne({ _id: userId }).select('isOwner');

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

  return allowed;
};
