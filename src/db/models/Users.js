import mongoose from 'mongoose';
import shortid from 'shortid';

const UserSchema = mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  username: String,
  details: Object,
  emails: Object,
});

const Users = mongoose.model('users', UserSchema);

export default Users;
