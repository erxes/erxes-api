import { connect } from '../db/connection';
import { Permissions } from '../db/models';

/**
 * Rename forms to lead
 */
module.exports.up = async () => {
  await connect();

  return Permissions.updateMany(
    { module: 'forms' },
    {
      $set: {
        module: 'lead',
        action: 'leadAll',
        requiredActions: ['showLeads', 'manageLeads'],
      },
    },
  );
};
