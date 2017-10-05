import mongoose from 'mongoose';
import shortid from 'shortid';

const TagSchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  name: String,
  type: String,
  colorCode: String,
  createdAt: Date,
  objectCount: Number,
});

class Tag {
  /**
   * Create a tag
   * @param  {Object} tagObj object
   * @return {Promise} Newly created tag object
   */
  static createTag(tagObj) {
    return this.create({
      ...tagObj,
      createdAt: new Date(),
    });
  }
}

TagSchema.loadClass(Tag);
const Tags = mongoose.model('tags', TagSchema);

export default Tags;
