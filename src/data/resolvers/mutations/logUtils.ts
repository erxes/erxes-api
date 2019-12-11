import { Users } from '../../../db/models/index';

export type LogDesc = {
  [key: string]: any;
} & { name: any };

interface ILogNameParams {
  idFields: string[];
  foreignKey: string;
  prevList?: LogDesc[];
}

interface ILogParams extends ILogNameParams {
  collection: any;
  nameFields: string[];
}

export const gatherUsernames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: Users,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['email', 'username'],
  });
};

/**
 * Finds name field from given collection
 * @param params.collection Collection to find
 * @param params.idFields Id fields saved in collection
 * @param params.foreignKey Name of id fields
 * @param params.prevList Array to save found id with name
 * @param params.nameFields List of values to be mapped to id field
 */
export const gatherNames = async (params: ILogParams): Promise<LogDesc[]> => {
  const { collection, idFields, foreignKey, prevList, nameFields = [] } = params;
  let options: LogDesc[] = [];

  if (prevList && prevList.length > 0) {
    options = prevList;
  }

  for (const id of idFields) {
    const item = await collection.findOne({ _id: id });
    let name: string = '';

    if (item) {
      for (const n of nameFields) {
        if (item[n]) {
          name = item[n];
        }
      }

      options.push({ [foreignKey]: id, name });
    }
  }

  return options;
};
