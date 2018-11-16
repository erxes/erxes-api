import { IContext } from '../../../connectionResolver';
import { ITopic } from '../../../db/models/definitions/knowledgebase';
import { IArticleCreate, ICategoryCreate } from '../../../db/models/KnowledgeBase';
import { moduleRequireLogin } from '../../permissions';

const knowledgeBaseMutations = {
  /**
   * Create topic document
   */
  knowledgeBaseTopicsAdd(_root, { doc }: { doc: ITopic }, { user, models: { KnowledgeBaseTopics } }: IContext) {
    return KnowledgeBaseTopics.createDoc(doc, user._id);
  },

  /**
   * Update topic document
   */
  knowledgeBaseTopicsEdit(
    _root,
    { _id, doc }: { _id: string; doc: ITopic },
    { user, models: { KnowledgeBaseTopics } }: IContext,
  ) {
    return KnowledgeBaseTopics.updateDoc(_id, doc, user._id);
  },

  /**
   * Remove topic document
   */
  knowledgeBaseTopicsRemove(_root, { _id }: { _id: string }, { models: { KnowledgeBaseTopics } }: IContext) {
    return KnowledgeBaseTopics.removeDoc(_id);
  },

  /**
   * Create category document
   */
  knowledgeBaseCategoriesAdd(
    _root,
    { doc }: { doc: ICategoryCreate },
    { user, models: { KnowledgeBaseCategories } }: IContext,
  ) {
    return KnowledgeBaseCategories.createDoc(doc, user._id);
  },

  /**
   * Update category document
   */
  knowledgeBaseCategoriesEdit(
    _root,
    { _id, doc }: { _id: string; doc: ICategoryCreate },
    { user, models: { KnowledgeBaseCategories } }: IContext,
  ) {
    return KnowledgeBaseCategories.updateDoc(_id, doc, user._id);
  },

  /**
   * Remove category document
   */
  knowledgeBaseCategoriesRemove(_root, { _id }: { _id: string }, { models: { KnowledgeBaseCategories } }: IContext) {
    return KnowledgeBaseCategories.removeDoc(_id);
  },

  /**
   * Create article document
   */
  knowledgeBaseArticlesAdd(
    _root,
    { doc }: { doc: IArticleCreate },
    { user, models: { KnowledgeBaseArticles } }: IContext,
  ) {
    return KnowledgeBaseArticles.createDoc(doc, user._id);
  },

  /**
   * Update article document
   */
  knowledgeBaseArticlesEdit(
    _root,
    { _id, doc }: { _id: string; doc: IArticleCreate },
    { user, models: { KnowledgeBaseArticles } }: IContext,
  ) {
    return KnowledgeBaseArticles.updateDoc(_id, doc, user._id);
  },

  /**
   * Remove article document
   */
  knowledgeBaseArticlesRemove(_root, { _id }: { _id: string }, { models: { KnowledgeBaseArticles } }: IContext) {
    return KnowledgeBaseArticles.removeDoc(_id);
  },
};

moduleRequireLogin(knowledgeBaseMutations);

export default knowledgeBaseMutations;
