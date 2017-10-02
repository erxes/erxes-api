import mongoose from 'mongoose';
import utils from '../utils';

const UserSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
    default: () => utils.random.id(),
  },
  username: String,
  details: Object,
  emails: Object,
});

const Users = mongoose.model('users', UserSchema);

export default Users;
