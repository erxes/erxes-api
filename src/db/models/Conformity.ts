import { Model, model } from 'mongoose';
import { Deals, Tasks, Tickets } from './';
import {
  conformitySchema,
  IConformityAdd,
  IConformityChange,
  IConformityDocument,
  IConformityEdit,
  IConformityFilter,
  IConformityRemove,
  IConformitySaved,
} from './definitions/conformity';

const getSavedAnyConformityMatch = ({ mainType, mainTypeId }: { mainType: string; mainTypeId: string }) => {
  return {
    $or: [
      {
        $and: [{ mainType }, { mainTypeId }],
      },
      {
        $and: [{ relType: mainType }, { relTypeId: mainTypeId }],
      },
    ],
  };
};

const getMainItem = (mainType: string, mainTypeId: string) => {
  switch (mainType) {
    case 'deal':
      return Deals.getDeal(mainTypeId);
    case 'task':
      return Tasks.getTask(mainTypeId);
    case 'ticket':
      return Tickets.getTicket(mainTypeId);
  }
};

export interface IConformityModel extends Model<IConformityDocument> {
  addConformity(doc: IConformityAdd): Promise<IConformityDocument>;
  editConformity(doc: IConformityEdit): Promise<any>;
  savedConformity(doc: IConformitySaved): Promise<string[]>;
  changeConformity(doc: IConformityChange): void;
  filterConformity(doc: IConformityFilter): Promise<string[]>;
  relatedConformity(doc: IConformitySaved): Promise<string[]>;
  removeConformity(doc: IConformityRemove): void;
}

export const loadConformityClass = () => {
  class Conformity {
    /**
     * Create a conformity
     */
    public static async addConformity(doc: IConformityAdd) {
      return Conformities.create(doc);
    }

    public static async editConformity(doc: IConformityEdit) {
      const newRelTypeIds = doc.relTypeIds || [];
      const oldRelTypeIds = await Conformity.savedConformity({
        mainType: doc.mainType,
        mainTypeId: doc.mainTypeId,
        relType: doc.relType,
      });

      const removedTypeIds = oldRelTypeIds.filter(e => !newRelTypeIds.includes(e));
      const addedTypeIds = newRelTypeIds.filter(e => !oldRelTypeIds.includes(e));

      // insert on new relTypeIds
      const insertTypes = await addedTypeIds.map(relTypeId => ({
        mainType: doc.mainType,
        mainTypeId: doc.mainTypeId,
        relType: doc.relType,
        relTypeId,
      }));
      Conformities.insertMany(insertTypes);

      // delete on removedTypeIds
      await Conformities.deleteMany({
        $or: [
          {
            $and: [
              { mainType: doc.mainType },
              { mainTypeId: doc.mainTypeId },
              { relType: doc.relType },
              { relTypeId: { $in: removedTypeIds } },
            ],
          },
          {
            $and: [
              { mainType: doc.relType },
              { mainTypeId: { $in: removedTypeIds } },
              { relType: doc.mainType },
              { relTypeId: doc.mainTypeId },
            ],
          },
        ],
      });
      return getMainItem(doc.mainType, doc.mainTypeId);
    }

    public static async savedConformity(doc: IConformitySaved) {
      const relTypeIds = await Conformities.aggregate([
        {
          $match: {
            $or: [
              {
                $and: [{ mainType: doc.mainType }, { mainTypeId: doc.mainTypeId }, { relType: doc.relType }],
              },
              {
                $and: [{ mainType: doc.relType }, { relType: doc.mainType }, { relTypeId: doc.mainTypeId }],
              },
            ],
          },
        },
        {
          $project: {
            relTypeId: {
              $cond: {
                if: { $eq: ['$mainType', doc.mainType] },
                then: '$relTypeId',
                else: '$mainTypeId',
              },
            },
          },
        },
      ]);
      return relTypeIds.map(item => String(item.relTypeId));
    }

    public static async changeConformity(doc: IConformityChange) {
      await Conformities.updateMany(
        { $and: [{ mainType: doc.type }, { mainTypeId: { $in: doc.oldTypeIds } }] },
        { $set: { mainTypeId: doc.newTypeId } },
        { multi: true },
      );

      await Conformities.updateMany(
        { $and: [{ relType: doc.type }, { relTypeId: { $in: doc.oldTypeIds } }] },
        { $set: { relTypeId: doc.newTypeId } },
        { multi: true },
      );
    }

    public static async filterConformity(doc: IConformityFilter) {
      const relTypeIds = await Conformities.aggregate([
        {
          $match: {
            $or: [
              {
                $and: [{ mainType: doc.mainType }, { mainTypeId: { $in: doc.mainTypeIds } }, { relType: doc.relType }],
              },
              {
                $and: [{ mainType: doc.relType }, { relType: doc.mainType }, { relTypeId: { $in: doc.mainTypeIds } }],
              },
            ],
          },
        },
        {
          $project: {
            relTypeId: {
              $cond: {
                if: { $eq: ['$mainType', doc.mainType] },
                then: '$relTypeId',
                else: '$mainTypeId',
              },
            },
          },
        },
      ]);
      return relTypeIds.map(item => String(item.relTypeId));
    }

    public static async relatedConformity(doc: IConformitySaved) {
      if (!(doc.mainType && doc.mainTypeId)) {
        return [];
      }

      const match = getSavedAnyConformityMatch({
        mainType: doc.mainType,
        mainTypeId: doc.mainTypeId,
      });

      const savedRelatedObjects = await Conformities.aggregate([
        { $match: match },
        {
          $project: {
            savedRelType: {
              $cond: {
                if: {
                  $eq: ['$mainType', doc.mainType],
                },
                then: '$relType',
                else: '$mainType',
              },
            },
            savedRelTypeId: {
              $cond: {
                if: {
                  $eq: ['$mainType', doc.mainType],
                },
                then: '$relTypeId',
                else: '$mainTypeId',
              },
            },
          },
        },
      ]);

      const savedList = savedRelatedObjects.map(item => item.savedRelType + '-' + item.savedRelTypeId);

      const relTypeIds = await Conformities.aggregate([
        {
          $project: {
            mainType: 1,
            mainTypeId: 1,
            relType: 1,
            relTypeId: 1,
            mainStr: { $concat: ['$mainType', '-', '$mainTypeId'] },
            relStr: { $concat: ['$relType', '-', '$relTypeId'] },
          },
        },
        {
          $match: {
            $or: [
              {
                $and: [{ mainType: doc.relType }, { relStr: { $in: savedList } }],
              },
              {
                $and: [{ relType: doc.relType }, { mainStr: { $in: savedList } }],
              },
            ],
          },
        },
        {
          $project: {
            relTypeId: {
              $cond: {
                if: {
                  $eq: ['$mainType', doc.relType],
                },
                then: '$mainTypeId',
                else: '$relTypeId',
              },
            },
          },
        },
      ]);

      return relTypeIds.map(item => String(item.relTypeId));
    }

    /**
     * Remove conformity
     */
    public static async removeConformity(doc: IConformityRemove) {
      const match = getSavedAnyConformityMatch({
        mainType: doc.mainType,
        mainTypeId: doc.mainTypeId,
      });
      await Conformities.deleteMany(match);
    }
  }

  conformitySchema.loadClass(Conformity);
  return conformitySchema;
};

loadConformityClass();

// tslint:disable-next-line
const Conformities = model<IConformityDocument, IConformityModel>('conformity', conformitySchema);

export default Conformities;
