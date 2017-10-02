import mongoose from 'mongoose';
import { random } from '../utils';

const TagSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => random.id(),
  },
  name: String,
  type: String,
  colorCode: String,
  createdAt: Date,
  objectCount: Number,
});

const Tags = mongoose.model('tags', TagSchema);

export default Tags;
