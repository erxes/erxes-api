import { Cars } from '../../../db/models';
import { ICar } from '../../../db/models/definitions/cars';
import { MODULE_NAMES } from '../../constants';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../logUtils';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface ICarsEdit extends ICar {
  _id: string;
}

const carMutations = {
  /**
   * Creates a new car
   */
  async carsAdd(_root, doc: ICar, { user, docModifier }: IContext) {
    const car = await Cars.createCar(docModifier(doc), user);

    await putCreateLog(
      {
        type: MODULE_NAMES.COMPANY,
        newData: doc,
        object: car,
      },
      user,
    );

    return car;
  },

  /**
   * Updates a car
   */
  async carsEdit(_root, { _id, ...doc }: ICarsEdit, { user }: IContext) {
    const car = await Cars.getCar(_id);
    const updated = await Cars.updateCar(_id, doc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.COMPANY,
        object: car,
        newData: doc,
        updatedDocument: updated,
      },
      user,
    );

    return updated;
  },

  /**
   * Removes cars
   */
  async carsRemove(_root, { carIds }: { carIds: string[] }, { user }: IContext) {
    const cars = await Cars.find({ _id: { $in: carIds } }).lean();

    await Cars.removeCars(carIds);

    for (const car of cars) {
      await putDeleteLog({ type: MODULE_NAMES.COMPANY, object: car }, user);
    }

    return carIds;
  },

  /**
   * Merge cars
   */
  async carsMerge(_root, { carIds, carFields }: { carIds: string[]; carFields: ICar }) {
    return Cars.mergeCars(carIds, carFields);
  },
};

checkPermission(carMutations, 'carsAdd', 'carsAdd');
checkPermission(carMutations, 'carsEdit', 'carsEdit');
checkPermission(carMutations, 'carsRemove', 'carsRemove');
checkPermission(carMutations, 'carsMerge', 'carsMerge');

export default carMutations;
