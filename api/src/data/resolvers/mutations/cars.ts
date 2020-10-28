import { CarCategories, Cars } from '../../../db/models';
import { ICar, ICarCategory } from '../../../db/models/definitions/cars';
import { MODULE_NAMES } from '../../constants';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../logUtils';
import { checkPermission } from '../../permissions/wrappers';
import { IContext } from '../../types';

interface ICarsEdit extends ICar {
  _id: string;
}

interface ICarCategoriesEdit extends ICarCategory {
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

  /**
   * Creates a new car category
   * @param {Object} doc Car category document
   */
  async carCategoriesAdd(_root, doc: ICarCategory, { user, docModifier }: IContext) {
    const carCategory = await CarCategories.createCarCategory(docModifier(doc));

    await putCreateLog(
      {
        type: MODULE_NAMES.CAR_CATEGORY,
        newData: { ...doc, order: carCategory.order },
        object: carCategory,
      },
      user,
    );

    return carCategory;
  },

  /**
   * Edits a car category
   * @param {string} param2._id CarCategory id
   * @param {Object} param2.doc CarCategory info
   */
  async carCategoriesEdit(_root, { _id, ...doc }: ICarCategoriesEdit, { user }: IContext) {
    const carCategory = await CarCategories.getCarCatogery({ _id });
    const updated = await CarCategories.updateCarCategory(_id, doc);

    await putUpdateLog(
      {
        type: MODULE_NAMES.CAR_CATEGORY,
        object: carCategory,
        newData: doc,
        updatedDocument: updated,
      },
      user,
    );

    return updated;
  },

  /**
   * Removes a car category
   * @param {string} param1._id CarCategory id
   */
  async carCategoriesRemove(_root, { _id }: { _id: string }, { user }: IContext) {
    const carCategory = await CarCategories.getCarCatogery({ _id });
    const removed = await CarCategories.removeCarCategory(_id);

    await putDeleteLog({ type: MODULE_NAMES.CAR_CATEGORY, object: carCategory }, user);

    return removed;
  },
};

checkPermission(carMutations, 'carsAdd', 'carsAdd');
checkPermission(carMutations, 'carsEdit', 'carsEdit');
checkPermission(carMutations, 'carsRemove', 'carsRemove');
checkPermission(carMutations, 'carsMerge', 'carsMerge');

export default carMutations;
