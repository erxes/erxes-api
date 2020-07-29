import { Model, model } from 'mongoose';
import { ActivityLogs, Conformities, Fields, InternalNotes } from '.';
import { validSearchText } from '../../data/utils';
import { carSchema, ICar, ICarDocument } from './definitions/cars';
import { ICustomField } from './definitions/common';
import { IUserDocument } from './definitions/users';

export interface ICarModel extends Model<ICarDocument> {
  getCarName(car: ICar): string;

  checkDuplication(
    carFields: {
      plateNumber?: string;
      vinNumber?: string;
    },
    idsToExclude?: string[] | string,
  ): never;

  fillSearchText(doc: ICar): string;

  getCar(_id: string): Promise<ICarDocument>;

  createCar(doc: ICar, user?: IUserDocument): Promise<ICarDocument>;

  updateCar(_id: string, doc: ICar): Promise<ICarDocument>;

  removeCars(_ids: string[]): Promise<{ n: number; ok: number }>;

  mergeCars(carIds: string[], carFields: ICar): Promise<ICarDocument>;

  bulkInsert(fieldNames: string[], fieldValues: string[][], user: IUserDocument): Promise<string[]>;
}

export const loadClass = () => {
  class Car {
    /**
     * Checking if car has duplicated unique properties
     */
    public static async checkDuplication(
      carFields: {
        plateNumber?: string;
        vinNumber?: string;
      },
      idsToExclude?: string[] | string,
    ) {
      const query: { status: {}; [key: string]: any } = { status: { $ne: 'deleted' } };
      let previousEntry;

      // Adding exclude operator to the query
      if (idsToExclude) {
        query._id = { $nin: idsToExclude };
      }

      if (carFields.plateNumber) {
        // check duplication from primaryName
        previousEntry = await Cars.find({
          ...query,
          plateNumber: carFields.plateNumber,
        });

        if (previousEntry.length > 0) {
          throw new Error('Duplicated plate number');
        }
      }

      if (carFields.vinNumber) {
        // check duplication from code
        previousEntry = await Cars.find({
          ...query,
          vinNumber: carFields.vinNumber,
        });

        if (previousEntry.length > 0) {
          throw new Error('Duplicated VIN number');
        }
      }
    }

    public static fillSearchText(doc: ICar) {
      return validSearchText([
        doc.modelsName || '',
        doc.plateNumber || '',
        doc.vinNumber || '',
        doc.description || '',
        doc.series || '',
        doc.manufactureBrand || ''
      ]);
    }

    public static getCarName(car: ICar) {
      return car.plateNumber || car.vinNumber || car.modelsName || car.series || car.manufactureBrand || 'Unknown';
    }

    /**
     * Retreives car
     */
    public static async getCar(_id: string) {
      const car = await Cars.findOne({ _id });

      if (!car) {
        throw new Error('Car not found');
      }

      return car;
    }

    /**
     * Create a car
     */
    public static async createCar(doc: ICar, user: IUserDocument) {
      // Checking duplicated fields of car
      await Cars.checkDuplication(doc);

      if (!doc.ownerId && user) {
        doc.ownerId = user._id;
      }

      // clean custom field values
      doc.customFieldsData = await Fields.prepareCustomFieldsData(doc.customFieldsData);

      const car = await Cars.create({
        ...doc,
        createdAt: new Date(),
        modifiedAt: new Date(),
        searchText: Cars.fillSearchText(doc),
      });

      // create log
      await ActivityLogs.createCocLog({ coc: car, contentType: 'car' });

      return car;
    }

    /**
     * Update car
     */
    public static async updateCar(_id: string, doc: ICar) {
      // Checking duplicated fields of car
      await Cars.checkDuplication(doc, [_id]);

      // clean custom field values
      if (doc.customFieldsData) {
        doc.customFieldsData = await Fields.prepareCustomFieldsData(doc.customFieldsData);
      }

      const searchText = Cars.fillSearchText(Object.assign(await Cars.getCar(_id), doc) as ICar);

      await Cars.updateOne({ _id }, { $set: { ...doc, searchText, modifiedAt: new Date() } });

      return Cars.findOne({ _id });
    }

    /**
     * Remove car
     */
    public static async removeCars(carIds: string[]) {
      // Removing modules associated with car
      await InternalNotes.removeCarsInternalNotes(carIds);

      for (const carId of carIds) {
        await Conformities.removeConformity({ mainType: 'car', mainTypeId: carId });
      }

      return Cars.deleteMany({ _id: { $in: carIds } });
    }

    /**
     * Merge cars
     */
    public static async mergeCars(carIds: string[], carFields: ICar) {
      // Checking duplicated fields of car
      await this.checkDuplication(carFields, carIds);

      let scopeBrandIds: string[] = [];
      let customFieldsData: ICustomField[] = [];
      let tagIds: string[] = [];
      let names: string[] = [];
      let emails: string[] = [];
      let phones: string[] = [];

      // Merging car tags
      for (const carId of carIds) {
        const carObj = await Cars.getCar(carId);

        const carTags = carObj.tagIds || [];
        const carScopeBrandIds = carObj.scopeBrandIds || [];

        // Merging scopeBrandIds
        scopeBrandIds = scopeBrandIds.concat(carScopeBrandIds);

        // merge custom fields data
        customFieldsData = [...customFieldsData, ...(carObj.customFieldsData || [])];

        // Merging car's tag into 1 array
        tagIds = tagIds.concat(carTags);

        carObj.status = 'deleted';

        await Cars.findByIdAndUpdate(carId, { $set: { status: 'deleted' } });
      }

      // Removing Duplicates
      tagIds = Array.from(new Set(tagIds));
      names = Array.from(new Set(names));
      emails = Array.from(new Set(emails));
      phones = Array.from(new Set(phones));

      // Creating car with properties
      const car = await Cars.createCar({
        ...carFields,
        scopeBrandIds,
        customFieldsData,
        tagIds,
        mergedIds: carIds,
      });

      // Updating customer cars, deals, tasks, tickets
      await Conformities.changeConformity({ type: 'car', newTypeId: car._id, oldTypeIds: carIds });

      // Removing modules associated with current cars
      await InternalNotes.changeCar(car._id, carIds);

      return car;
    }
  }

  carSchema.loadClass(Car);

  return carSchema;
};

loadClass();

// tslint:disable-next-line
const Cars = model<ICarDocument, ICarModel>('cars', carSchema);

export default Cars;
