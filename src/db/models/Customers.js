import mongoose from 'mongoose';
import { random } from '../utils';

const CustomerSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => random.id(),
  },
  integrationId: String,
  name: String,
  email: String,
  phone: String,
  isUser: Boolean,
  createdAt: Date,
  internalNotes: Object,
  messengerData: Object,
  twitterData: Object,
  facebookData: Object,
});

class Customer {
  /**
   * Mark customer as inactive
   * @param  {String} customerId
   * @return {Promise} Updated customer
   */
  static markCustomerAsNotActive(customerId) {
    return this.findByIdAndUpdate(
      customerId,
      {
        $set: {
          'messengerData.isActive': false,
          'messengerData.lastSeenAt': new Date(),
        },
      },
      { new: true },
    );
  }
}

CustomerSchema.loadClass(Customer);

export const Customers = mongoose.model('customers', CustomerSchema);

const SegmentSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => random.id(),
  },
  name: String,
  description: String,
  subOf: String,
  color: String,
  connector: String,
  conditions: Object,
});

export const Segments = mongoose.model('segments', SegmentSchema);
