import mongoose from 'mongoose';
import { PUBLISH_STATUSES } from '../../data/constants';
import { field } from './utils';

// Schema for common fields
const commonFields = {
  createdBy: field({ type: String }),
  createdDate: field({
    type: Date,
  }),
  modifiedBy: field({ type: String }),
  modifiedDate: field({
    type: Date,
  }),
};

/**
 * Base class for Knowledge base classes
 */
class KnowledgeBaseCommonDocument {
  /**
   * Create document with given parameters, also set createdBy by given
   * userId and also check if its supplied
   * @param {Object} doc - Knowledge base document object
   * @param {string} userId - User id of the creator of this document
   * @return {Promise} - returns Promise resolving newly added document
   * @throws {Error} - throws Error('userId must be supplied') if the userId is not supplied
   */
  static createBaseDoc(doc, userId) {
    if (!userId) {
      throw new Error('userId must be supplied');
    }

    return this.create({
      ...doc,
      createdDate: new Date(),
      createdBy: userId,
      modifiedDate: new Date(),
    });
  }

  /**
   * Update knowledge base document
   * @param {string} - Id of the document
   * @param {Object} - Document Object
   * @param {string} - The user id of the modifier
   * @return {Promsie} - returns Promise resolving updated document
   */
  static async updateBaseDoc(_id, doc, userId) {
    if (!userId) {
      throw new Error('userId must be supplied');
    }

    await this.update(
      { _id },
      {
        $set: {
          ...doc,
          modifiedBy: userId,
          modifiedDate: new Date(),
        },
      },
    );

    return this.findOne({ _id });
  }

  /**
   * Removed document
   * @param {string} _id - Document id
   * @return {Promise}
   */
  static removeDoc(_id) {
    return this.remove({ _id });
  }
}

const ArticleSchema = mongoose.Schema({
  _id: field({ pkey: true }),
  title: field({ type: String }),
  summary: field({ type: String }),
  content: field({ type: String }),
  status: field({
    type: String,
    enum: PUBLISH_STATUSES.ALL,
    default: PUBLISH_STATUSES.DRAFT,
  }),
  ...commonFields,
});

class Article extends KnowledgeBaseCommonDocument {
  /**
   * Create KnowledgeBaseArticle document
   * @param {Object} doc - KnowledgeBaseArticle object
   * @param {string} doc.title - KnowledgeBaseArticle title
   * @param {string} doc.summary - KnowledgeBaseArticle summary
   * @param {string} doc.content - KnowledgeBaseArticle content
   * @param {string} doc.status - KnowledgeBaseArticle status (currently: 'draft' or 'publish')
   * @param {string[]} doc.categoryIds - list of parent Category ids
   * @param {string} userId - User id of the creator of this document
   * @return {Promise} - returns Promise resolving created document
   */
  static async createDoc({ categoryIds, ...docFields }, userId) {
    const article = await this.createBaseDoc(docFields, userId);
    if ((categoryIds || []).length > 0) {
      for (let category of await KnowledgeBaseCategories.find({ _id: { $in: categoryIds } })) {
        category.articleIds.push(article._id.toString());
        await category.save();
      }
    }
    return article;
  }

  /**
   * Update KnowledgeBaseArticle document
   * @param {Object} _id - KnowldegeBaseArticle document id
   * @param {Object} doc - KnowledgeBaseArticle object
   * @param {string} doc.title - KnowledgeBaseArticle title
   * @param {string} doc.summary - KnowledgeBaseArticle summary
   * @param {string} doc.content - KnowledgeBaseArticle content
   * @param {string} doc.status - KnowledgeBaseArticle status (currently: 'draft' or 'publish')
   * @param {string[]} doc.categoryIds - list of parent Category ids
   * @param {string} userId - User id of the modifier of this document
   * @return {Promise} - returns Promise resolving modified document
   */
  static async updateDoc(_id, { categoryIds, ...docFields }, userId) {
    await this.updateBaseDoc({ _id }, docFields, userId);

    const article = await this.findOne({ _id });

    if ((categoryIds || []).length > 0) {
      for (let category of await KnowledgeBaseCategories.find({ _id: { $in: categoryIds } })) {
        if (category.articleIds.indexOf(article._id.toString()) == -1) {
          category.articleIds.push(article._id.toString());
          await category.save();
        }
      }
    }

    return article;
  }

  /**
   * Removes KnowledgeBaseArticle document
   * @param {Object} _id - KnowldegeBaseArticle document id
   * @return {Promise}
   * @throws {Error} - Thrwos Error('You can not delete this. This article is used in category.')
   * if there are categories using this article
   */
  static removeDoc(_id) {
    return this.remove({ _id });
  }
}

const CategorySchema = mongoose.Schema({
  _id: field({ pkey: true }),
  title: field({ type: String }),
  description: field({ type: String }),
  articleIds: field({ type: [String] }),
  icon: field({ type: String }),
  ...commonFields,
});

class Category extends KnowledgeBaseCommonDocument {
  /**
   * Create KnowledgeBaseCategory document
   * @param {Object} doc - KnowledgeBaseCategory object
   * @param {string} doc.title - KnowledgeBaseCategory title
   * @param {string} doc.description - KnowledgeBaseCategory description
   * @param {string[]} doc.articleIds - KnowledgeBaseCategory articleIds
   * @param {string} doc.icon - Select icon name
   * @param {string} userId - User id of the creator of this document
   * @param {string[]} doc.topicIds - list of parent Topic ids
   * @return {Promise} - returns Promise resolving created document
   */
  static async createDoc({ topicIds, ...docFields }, userId) {
    const category = await this.createBaseDoc(docFields, userId);

    if ((topicIds || []).length > 0) {
      for (let topic of await KnowledgeBaseTopics.find({ _id: { $in: topicIds } })) {
        topic.categoryIds.push(category._id.toString());
        await topic.save();
      }
    }
    return category;
  }

  /**
   * Update KnowledgeBaseCategory document
   * @param {Object} _id - KnowledgeBaseCategory document id
   * @param {Object} doc - KnowledgeBaseCategory object
   * @param {string} doc.title - KnowledgeBaseCategory title
   * @param {string} doc.description - KnowledgeBaseCategory description
   * @param {string[]} doc.articleIds - KnowledgeBaseCategory articleIds
   * @param {string} doc.icon - Select icon name
   * @param {string[]} doc.topicIds - list of parent Topic ids
   * @param {string} userId - User id of the modifier of this document
   * @param {string} topicId - parentTopicId
   * @return {Promise} - returns Promise resolving modified document
   */
  static async updateDoc(_id, { topicIds, ...docFields }, userId) {
    await this.updateBaseDoc({ _id }, docFields, userId);

    const category = await this.findOne({ _id });

    if ((topicIds || []).length > 0) {
      for (let topic of await KnowledgeBaseTopics.find({ _id: { $in: topicIds } })) {
        if (topic.categoryIds.indexOf(category._id.toString()) == -1) {
          topic.categoryIds.push(category._id.toString());
          await topic.save();
        }
      }
    }

    return category;
  }

  /**
   * Removes KnowledgeBaseCategory document and it's children articles
   * @param {Object} _id - KnowledgeBaseCategory document id
   * @return {Promise}
   */
  static async removeDoc(_id) {
    const category = await this.findOne({ _id });

    for (let articleId of category.articleIds || []) {
      await KnowledgeBaseArticles.remove({ _id: articleId });
    }
    return this.remove({ _id });
  }
}

const TopicSchema = mongoose.Schema({
  _id: field({ pkey: true }),
  title: field({ type: String }),
  description: field({ type: String }),
  brandId: field({ type: String }),
  categoryIds: field({
    type: [String],
    required: false,
  }),
  ...commonFields,
});

class Topic extends KnowledgeBaseCommonDocument {
  /**
   * Create KnowledgeBaseTopic document
   * @param {Object} doc - KnowledgeBaseTopic object
   * @param {string} doc.title - KnowledgeBaseTopic title
   * @param {string} doc.description - KnowledgeBaseTopic description
   * @param {string[]} doc.categoryIds - KnowledgeBaseTopic category ids
   * @param {string} doc.brandId - Id of the brand related to this topic
   * @param {string} userId - User id of the creator of this document
   * @return {Promise} - returns Promise resolving created document
   */
  static createDoc(docFields, userId) {
    return this.createBaseDoc(docFields, userId);
  }

  /**
   * Update KnowledgeBaseTopic document
   * @param {Object} _id - KnowledgeBaseTopic document id
   * @param {Object} doc - KnowledgeBaseTopic object
   * @param {string} doc.title - KnowledgeBaseTopic title
   * @param {string} doc.description - KnowledgeBaseTopic description
   * @param {string[]} doc.categoryIds - KnowledgeBaseTopic category ids
   * @param {string} doc.brandId - Id of the brand related to this topic
   * @param {string} userId - User id of the modifier of this document
   * @return {Promise} - returns Promise resolving modified document
   */
  static updateDoc(_id, docFields, userId) {
    return this.updateBaseDoc(_id, docFields, userId);
  }

  /**
   * Removes KnowledgeBaseTopic document and it's children categories
   * @param {Object} _id - KnowledgeBaseTopic document id
   * @return {Promise}
   */
  static async removeDoc(_id) {
    const topic = await this.findOne({ _id });

    for (let categoryId of topic.categoryIds || []) {
      const category = await KnowledgeBaseCategories.findOne({ _id: categoryId });
      if (category) {
        await KnowledgeBaseCategories.removeDoc(categoryId);
      }
    }
    return this.remove({ _id });
  }
}

ArticleSchema.loadClass(Article);
export const KnowledgeBaseArticles = mongoose.model('knowledgebase_articles', ArticleSchema);

CategorySchema.loadClass(Category);
export const KnowledgeBaseCategories = mongoose.model('knowledgebase_categories', CategorySchema);

TopicSchema.loadClass(Topic);
export const KnowledgeBaseTopics = mongoose.model('knowledgebase_topics', TopicSchema);
