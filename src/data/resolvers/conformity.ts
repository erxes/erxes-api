import { Users } from '../../db/models';
import { IConformityDocument } from '../../db/models/definitions/conformities';

export default {
  createdUser(conformity: IConformityDocument) {
    return Users.findOne({ _id: conformity._id });
  },
};
