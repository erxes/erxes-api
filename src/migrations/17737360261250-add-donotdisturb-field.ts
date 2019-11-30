import { connect } from '../db/connection';
import { Users } from '../db/models';

module.exports.up = async () => {
  await connect();

  await Users.updateMany({}, { $set: { doNotDisturb: 'No' } });
};
