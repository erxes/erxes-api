import * as _ from 'underscore';
import { IPipelineDocument } from '../../../db/models/definitions/boards';
import { IChannelDocument } from '../../../db/models/definitions/channels';
import { ICompanyDocument } from '../../../db/models/definitions/companies';
import { ACTIVITY_CONTENT_TYPES } from '../../../db/models/definitions/constants';
import { ICustomerDocument } from '../../../db/models/definitions/customers';
import { IDealDocument, IProductDocument } from '../../../db/models/definitions/deals';
import { IEngageMessage, IEngageMessageDocument } from '../../../db/models/definitions/engages';
import { IGrowthHackDocument } from '../../../db/models/definitions/growthHacks';
import { IIntegrationDocument } from '../../../db/models/definitions/integrations';
import { ICategoryDocument, ITopicDocument } from '../../../db/models/definitions/knowledgebase';
import { IPipelineTemplateDocument } from '../../../db/models/definitions/pipelineTemplates';
import { IScriptDocument } from '../../../db/models/definitions/scripts';
import { ITaskDocument } from '../../../db/models/definitions/tasks';
import { ITicketDocument } from '../../../db/models/definitions/tickets';
import {
  Boards,
  Brands,
  Companies,
  Customers,
  Deals,
  Forms,
  Integrations,
  KnowledgeBaseArticles,
  KnowledgeBaseCategories,
  KnowledgeBaseTopics,
  PipelineLabels,
  ProductCategories,
  Products,
  Segments,
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

type BoardItemDocument = IDealDocument | ITaskDocument | ITicketDocument | IGrowthHackDocument;

export const gatherUsernames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

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

  return gatherNames({
    collection: Stages,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['name'],
  });
};

export const gatherProductNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

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

  return gatherNames({
    collection: Brands,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['name'],
  });
};

export const gatherFormNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  return gatherNames({
    collection: Forms,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['title'],
  });
};

export const gatherSegmentNames = async (params: ILogNameParams): Promise<LogDesc[]> => {
  const { idFields, foreignKey, prevList } = params;

  return gatherNames({
    collection: Segments,
    idFields,
    foreignKey,
    prevList,
    nameFields: ['name'],
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

  const uniqueIds = _.compact(_.uniq(idFields));

  for (const id of uniqueIds) {
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

  if (contentType === ACTIVITY_CONTENT_TYPES.DEAL) {
    item = await Deals.findOne({ _id: contentTypeId });
  }

  if (contentType === ACTIVITY_CONTENT_TYPES.TASK) {
    item = await Tasks.findOne({ _id: contentTypeId });
  }

  if (contentType === ACTIVITY_CONTENT_TYPES.TICKET) {
    item = await Tickets.findOne({ _id: contentTypeId });
  }

  if (item && item.name) {
    name = item.name;
  }

  return name;
};

export const gatherCompanyFieldNames = async (doc: ICompanyDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  if (doc.parentCompanyId) {
    options = await gatherCompanyNames({
      idFields: [doc.parentCompanyId],
      foreignKey: 'parentCompanyId',
      prevList: options,
    });
  }

  if (doc.ownerId) {
    options = await gatherUsernames({
      idFields: [doc.ownerId],
      foreignKey: 'ownerId',
      prevList: options,
    });
  }

  if (doc.mergedIds && doc.mergedIds.length > 0) {
    options = await gatherCompanyNames({
      idFields: doc.mergedIds,
      foreignKey: 'mergedIds',
      prevList: options,
    });
  }

  if (doc.tagIds && doc.tagIds.length > 0) {
    options = await gatherTagNames({
      idFields: doc.tagIds,
      foreignKey: 'tagIds',
      prevList: options,
    });
  }

  return options;
};

export const gatherCustomerFieldNames = async (doc: ICustomerDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  if (doc.ownerId) {
    options = await gatherUsernames({ idFields: [doc.ownerId], foreignKey: 'ownerId', prevList: options });
  }

  if (doc.integrationId) {
    options = await gatherIntegrationNames({
      idFields: [doc.integrationId],
      foreignKey: 'integrationId',
      prevList: options,
    });
  }

  if (doc.tagIds && doc.tagIds.length > 0) {
    options = await gatherTagNames({
      idFields: doc.tagIds,
      foreignKey: 'tagIds',
      prevList: options,
    });
  }

  if (doc.mergedIds) {
    options = await gatherCustomerNames({
      idFields: doc.mergedIds,
      foreignKey: 'mergedIds',
      prevList: options,
    });
  }

  return options;
};

export const gatherBoardItemFieldNames = async (doc: BoardItemDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  if (doc.userId) {
    options = await gatherUsernames({
      idFields: [doc.userId],
      foreignKey: 'userId',
      prevList: options,
    });
  }

  if (doc.assignedUserIds && doc.assignedUserIds.length > 0) {
    options = await gatherUsernames({
      idFields: doc.assignedUserIds,
      foreignKey: 'assignedUserIds',
      prevList: options,
    });
  }

  if (doc.watchedUserIds && doc.watchedUserIds.length > 0) {
    options = await gatherUsernames({
      idFields: doc.watchedUserIds,
      foreignKey: 'watchedUserIds',
      prevList: options,
    });
  }

  if (doc.labelIds && doc.labelIds.length > 0) {
    options = await gatherNames({
      collection: PipelineLabels,
      idFields: doc.labelIds,
      foreignKey: 'labelIds',
      prevList: options,
      nameFields: ['name'],
    });
  }

  options = await gatherStageNames({
    idFields: [doc.stageId],
    foreignKey: 'stageId',
    prevList: options,
  });

  if (doc.initialStageId) {
    options = await gatherStageNames({
      idFields: [doc.initialStageId],
      foreignKey: 'initialStageId',
      prevList: options,
    });
  }

  if (doc.modifiedBy) {
    options = await gatherUsernames({
      idFields: [doc.modifiedBy],
      foreignKey: 'modifiedBy',
      prevList: options,
    });
  }

  return options;
};

export const gatherDealFieldNames = async (doc: IDealDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  options = await gatherBoardItemFieldNames(doc, options);

  if (doc.productsData && doc.productsData.length > 0) {
    options = await gatherProductNames({
      idFields: doc.productsData.map(p => p.productId),
      foreignKey: 'productId',
      prevList: options,
    });
  }

  return options;
};

export const gatherEngageFieldNames = async (
  doc: IEngageMessageDocument | IEngageMessage,
  prevList?: LogDesc[],
): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  if (doc.segmentIds && doc.segmentIds.length > 0) {
    options = await gatherSegmentNames({
      idFields: doc.segmentIds,
      foreignKey: 'segmentIds',
      prevList: options,
    });
  }

  if (doc.brandIds && doc.brandIds.length > 0) {
    options = await gatherBrandNames({
      idFields: doc.brandIds,
      foreignKey: 'brandIds',
      prevList: options,
    });
  }

  if (doc.tagIds && doc.tagIds.length > 0) {
    options = await gatherTagNames({
      idFields: doc.tagIds,
      foreignKey: 'tagIds',
      prevList: options,
    });
  }

  if (doc.fromUserId) {
    options = await gatherUsernames({
      idFields: [doc.fromUserId],
      foreignKey: 'fromUserId',
      prevList: options,
    });
  }

  if (doc.messenger && doc.messenger.brandId) {
    options = await gatherBrandNames({
      idFields: [doc.messenger.brandId],
      foreignKey: 'brandId',
      prevList: options,
    });
  }

  return options;
};

export const gatherChannelFieldNames = async (doc: IChannelDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  if (doc.userId) {
    options = await gatherUsernames({
      idFields: [doc.userId],
      foreignKey: 'userId',
      prevList: options,
    });
  }

  if (doc.memberIds && doc.memberIds.length > 0) {
    options = await gatherUsernames({
      idFields: doc.memberIds,
      foreignKey: 'memberIds',
      prevList: options,
    });
  }

  if (doc.integrationIds && doc.integrationIds.length > 0) {
    options = await gatherIntegrationNames({
      idFields: doc.integrationIds,
      foreignKey: 'integrationIds',
      prevList: options,
    });
  }

  return options;
};

export const gatherGHFieldNames = async (doc: IGrowthHackDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  options = await gatherBoardItemFieldNames(doc, options);

  if (doc.votedUserIds && doc.votedUserIds.length > 0) {
    options = await gatherUsernames({
      idFields: doc.votedUserIds,
      foreignKey: 'votedUserIds',
      prevList: options,
    });
  }

  return options;
};

export const gatherIntegrationFieldNames = async (doc: IIntegrationDocument, prevList?: LogDesc[]) => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  if (doc.createdUserId) {
    options = await gatherUsernames({
      idFields: [doc.createdUserId],
      foreignKey: 'createdUserId',
      prevList: options,
    });
  }

  if (doc.brandId) {
    options = await gatherBrandNames({
      idFields: [doc.brandId],
      foreignKey: 'brandId',
      prevList: options,
    });
  }

  if (doc.tagIds && doc.tagIds.length > 0) {
    options = await gatherTagNames({
      idFields: doc.tagIds,
      foreignKey: 'tagIds',
      prevList: options,
    });
  }

  if (doc.formId) {
    options = await gatherFormNames({
      idFields: [doc.formId],
      foreignKey: 'formId',
      prevList: options,
    });
  }

  return options;
};

export const gatherKbTopicFieldNames = async (doc: ITopicDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  options = await gatherUsernames({
    idFields: [doc.createdBy],
    foreignKey: 'createdBy',
    prevList: options,
  });

  options = await gatherUsernames({
    idFields: [doc.modifiedBy],
    foreignKey: 'modifiedBy',
    prevList: options,
  });

  if (doc.brandId) {
    options = await gatherBrandNames({
      idFields: [doc.brandId],
      foreignKey: 'brandId',
      prevList: options,
    });
  }

  if (doc.categoryIds && doc.categoryIds.length > 0) {
    // categories are removed alongside
    const categories = await KnowledgeBaseCategories.find({ _id: { $in: doc.categoryIds } }, { title: 1 });

    for (const cat of categories) {
      options.push({
        categoryIds: cat._id,
        name: cat.title,
      });
    }
  }

  return options;
};

export const gatherKbCategoryFieldNames = async (doc: ICategoryDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  const articles = await KnowledgeBaseArticles.find({ _id: { $in: doc.articleIds } }, { title: 1 });

  options = await gatherUsernames({
    idFields: [doc.createdBy],
    foreignKey: 'createdBy',
    prevList: options,
  });

  options = await gatherUsernames({
    idFields: [doc.modifiedBy],
    foreignKey: 'modifiedBy',
    prevList: options,
  });

  if (articles.length > 0) {
    for (const article of articles) {
      options.push({ articleIds: article._id, name: article.title });
    }
  }

  return options;
};

export const gatherProductFieldNames = async (doc: IProductDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  if (doc.tagIds && doc.tagIds.length > 0) {
    options = await gatherTagNames({
      idFields: doc.tagIds,
      foreignKey: 'tagIds',
      prevList: options,
    });
  }

  if (doc.categoryId) {
    options = await gatherProductCategoryNames({
      idFields: [doc.categoryId],
      foreignKey: 'categoryId',
      prevList: options,
    });
  }

  return options;
};

export const gatherScriptFieldNames = async (doc: IScriptDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  if (doc.messengerId) {
    options = await gatherIntegrationNames({
      idFields: [doc.messengerId],
      foreignKey: 'messengerId',
      prevList: options,
    });
  }

  if (doc.kbTopicId) {
    options = await gatherNames({
      collection: KnowledgeBaseTopics,
      idFields: [doc.kbTopicId],
      foreignKey: 'kbTopicId',
      prevList: options,
      nameFields: ['title'],
    });
  }

  if (doc.leadIds && doc.leadIds.length > 0) {
    options = await gatherIntegrationNames({
      idFields: doc.leadIds,
      foreignKey: 'leadIds',
      prevList: options,
    });
  }

  return options;
};

export const gatherPipelineFieldNames = async (doc: IPipelineDocument, prevList?: LogDesc[]): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  options = await gatherNames({
    collection: Boards,
    idFields: [doc.boardId],
    foreignKey: 'boardId',
    nameFields: ['name'],
    prevList: options,
  });

  if (doc.userId) {
    options = await gatherUsernames({
      idFields: [doc.userId],
      foreignKey: 'userId',
      prevList: options,
    });
  }

  if (doc.excludeCheckUserIds && doc.excludeCheckUserIds.length > 0) {
    options = await gatherUsernames({
      idFields: doc.excludeCheckUserIds,
      foreignKey: 'excludeCheckUserIds',
      prevList: options,
    });
  }

  if (doc.memberIds && doc.memberIds.length > 0) {
    options = await gatherUsernames({
      idFields: doc.memberIds,
      foreignKey: 'memberIds',
      prevList: options,
    });
  }

  if (doc.watchedUserIds && doc.watchedUserIds.length > 0) {
    options = await gatherUsernames({
      idFields: doc.watchedUserIds,
      foreignKey: 'watchedUserIds',
      prevList: options,
    });
  }

  return options;
};

export const gatherPipelineTemplateFieldNames = async (
  doc: IPipelineTemplateDocument,
  prevList?: LogDesc[],
): Promise<LogDesc[]> => {
  let options: LogDesc[] = [];

  if (prevList) {
    options = prevList;
  }

  options = await gatherUsernames({
    idFields: [doc.createdBy],
    foreignKey: 'createdBy',
    prevList: options,
  });

  if (doc.stages && doc.stages.length > 0) {
    options = await gatherFormNames({
      idFields: doc.stages.map(s => s.formId),
      foreignKey: 'formId',
      prevList: options,
    });
  }

  return options;
};
