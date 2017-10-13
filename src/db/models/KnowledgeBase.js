import mongoose from 'mongoose';
import shortid from 'shortid';

const KbArticlesSchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  title: String,
  summary: String,
  content: String,
  createdBy: String,
  createdDate: Date,
  modifiedBy: String,
  modifiedDate: Date,
  status: String,
  authorDetails: {
    avatar: String,
    fullName: String,
  },
});

const KbCategoriesSchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  title: String,
  description: String,
  articleIds: {
    type: [String],
    required: false,
  },
  icon: String,
  createdBy: String,
  createdDate: Date,
  modifiedBy: String,
  modifiedDate: Date,
});

const KbTopicsSchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  title: String,
  brandId: String,
  description: String,
  categoryIds: {
    type: [String],
    required: false,
  },
  loadType: String,
  createdBy: String,
  createdDate: Date,
  modifiedBy: String,
  modifiedDate: Date,
});

export const KnowledgeBaseArticles = mongoose.model('knowledgebase_articles', KbArticlesSchema);
export const KnowledgeBaseCategories = mongoose.model(
  'knowledgebase_categories',
  KbCategoriesSchema,
);
export const KnowledgeBaseTopics = mongoose.model('knowledgebase_topics', KbTopicsSchema);
