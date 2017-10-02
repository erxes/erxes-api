import mongoose from 'mongoose';
import shortid from 'shortid';

const TagSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: shortid.generate,
  },
  name: String,
  type: String,
  colorCode: String,
  createdAt: Date,
  objectCount: Number,
});

const Tags = mongoose.model('tags', TagSchema);

export default Tags;
