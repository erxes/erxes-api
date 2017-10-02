import mongoose from 'mongoose';
import { random } from '../utils';

const BrandSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => random.id(),
  },
  code: String,
  name: String,
  description: String,
  userId: String,
  createdAt: Date,
  emailConfig: Object,
});

const Brands = mongoose.model('brands', BrandSchema);

export default Brands;
