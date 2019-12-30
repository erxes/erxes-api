import { ACTIVITY_CONTENT_TYPES } from '../../../db/models/definitions/constants';
import { IDealDocument } from '../../../db/models/definitions/deals';
import { IGrowthHackDocument } from '../../../db/models/definitions/growthHacks';
import { ITaskDocument } from '../../../db/models/definitions/tasks';
import { ITicketDocument } from '../../../db/models/definitions/tickets';
import {
  Brands,
  Companies,
  Customers,
  Deals,
  Forms,
  Integrations,
  KnowledgeBaseArticles,
  KnowledgeBaseCategories,
  PipelineLabels,
  ProductCategories,
  Products,
  Stages,
  Tags,
  Tasks,
  Tickets,
  Users,
} from '../../../db/models/index';

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

interface IContentTypeParams {
  contentType: string;
  contentTypeId: string;
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

export const gatherCompanyNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: Companies,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['primaryName'],
  });
};

export const gatherCustomerNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: Customers,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['firstName'],
  });
};

export const gatherIntegrationNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: Integrations,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['name'],
  });
};

export const gatherTagNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: Tags,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['name'],
  });
};

export const gatherStageNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: Stages,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['name'],
  });
};

export const gatherLabelNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: PipelineLabels,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['name'],
  });
};

export const gatherProductNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: Products,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['name'],
  });
};

export const gatherProductCategoryNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: ProductCategories,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['name'],
  });
};

export const gatherBrandNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: Brands,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['name'],
  });
};

export const gatherKbArticleNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: KnowledgeBaseArticles,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['title'],
  });
};

export const gatherKbCategoryNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: KnowledgeBaseCategories,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['title'],
  });
};

export const gatherFormNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  if (!(idFields && foreignKey)) {
    return [];
  }

  return gatherNames({
    collection: Forms,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['title'],
  });
};

export const gatherUsernamesOfBoardItem = async (
  item: IDealDocument | ITaskDocument | ITicketDocument | IGrowthHackDocument,
): Promise<LogDesc[]> => {
  const { assignedUserIds, modifiedBy, watchedUserIds, userId } = item;

  let list: LogDesc[] = [];

  if (assignedUserIds && assignedUserIds.length > 0) {
    list = await gatherUsernames({
      idFields: assignedUserIds,
      foreignKey: 'assignedUserIds',
    });
  }

  if (modifiedBy) {
    const user = await Users.findOne({ _id: modifiedBy });

    if (user) {
      list.push({ modifiedBy: user._id, name: user.username || user.email });
    }
  }

  if (watchedUserIds && watchedUserIds.length > 0) {
    list = await gatherUsernames({
      idFields: watchedUserIds,
      foreignKey: 'watchedUserIds',
      prevList: list,
    });
  }

  if (userId) {
    const user = await Users.findOne({ _id: userId });

    if (user) {
      list.push({ userId, name: user.username || user.email });
    }
  }

  return list;
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

export const findItemName = async ({ contentType, contentTypeId }: IContentTypeParams): Promise<string> => {
  let item: any;
  let name: string = '';

  switch (contentType) {
    case ACTIVITY_CONTENT_TYPES.DEAL:
      item = await Deals.findOne({ _id: contentTypeId });

      break;
    case ACTIVITY_CONTENT_TYPES.TASK:
      item = await Tasks.findOne({ _id: contentTypeId });

      break;
    case ACTIVITY_CONTENT_TYPES.TICKET:
      item = await Tickets.findOne({ _id: contentTypeId });
      break;
    default:
      break;
  }

  if (item && item.name) {
    name = item.name;
  }

  return name;
};
