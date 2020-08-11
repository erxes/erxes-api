import { CarCategories, Conformities, Customers, Tags, Users } from '../../db/models';
import { ICarDocument } from '../../db/models/definitions/cars';

export default {
  category(car: ICarDocument) {
    return CarCategories.findOne({ _id: car.categoryId });
  },

  async customers(company: ICarDocument) {
    const customerIds = await Conformities.savedConformity({
      mainType: 'company',
      mainTypeId: company._id,
      relTypes: ['customer'],
    });

    return Customers.find({ _id: { $in: customerIds || [] } });
  },

  getTags(company: ICarDocument) {
    return Tags.find({ _id: { $in: company.tagIds || [] } });
  },

  owner(company: ICarDocument) {
    return Users.findOne({ _id: company.ownerId });
  },

};
