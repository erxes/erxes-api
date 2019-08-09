import { Conformities } from '../../../db/models';

// return relTypeIds = string[]
export const getSavedConformity = async ({
  mainType,
  mainTypeId,
  relType,
}: {
  mainType: string;
  mainTypeId: string;
  relType: string;
}) => {
  const relTypeIds = await Conformities.aggregate([
    {
      $match: {
        $or: [
          {
            $and: [{ mainType }, { mainTypeId }, { relType }],
          },
          {
            $and: [{ mainType: relType }, { relType: mainType }, { relTypeId: mainTypeId }],
          },
        ],
      },
    },
    {
      $project: {
        relTypeId: {
          $cond: {
            if: { $eq: ['$mainType', mainType] },
            then: '$relTypeId',
            else: '$mainTypeId',
          },
        },
      },
    },
  ]);
  return relTypeIds.map(item => String(item.relTypeId));
};

export const saveConformity = async ({
  mainType,
  mainTypeId,
  relType,
  relTypeIds,
}: {
  mainType: string;
  mainTypeId: string;
  relType: string;
  relTypeIds: string[];
}) => {
  const newRelTypeIds = relTypeIds || [];
  const oldRelTypeIds = await getSavedConformity({
    mainType,
    mainTypeId,
    relType,
  });

  const removedTypeIds = oldRelTypeIds.filter(e => !newRelTypeIds.includes(e));
  const addedTypeIds = newRelTypeIds.filter(e => !oldRelTypeIds.includes(e));

  // insert on new relTypeIds
  const insertTypes = await addedTypeIds.map(relTypeId => ({
    mainType,
    mainTypeId,
    relType,
    relTypeId,
  }));
  Conformities.insertMany(insertTypes);

  // delete on removedTypeIds
  await Conformities.deleteMany({
    $or: [
      {
        $and: [{ mainType }, { mainTypeId }, { relType }, { relTypeId: { $in: removedTypeIds } }],
      },
      {
        $and: [
          { mainType: relType },
          { mainTypeId: { $in: removedTypeIds } },
          { relType: mainType },
          { relTypeId: mainTypeId },
        ],
      },
    ],
  });
};

export const getSavedAnyConformityMatch = ({ mainType, mainTypeId }: { mainType: string; mainTypeId: string }) => {
  return {
    $match: {
      $or: [
        {
          $and: [{ mainType }, { mainTypeId }],
        },
        {
          $and: [{ relType: mainType }, { relTypeId: mainTypeId }],
        },
      ],
    },
  };
};

export const removeConformity = async ({ mainType, mainTypeId }: { mainType: string; mainTypeId: string }) => {
  const match = getSavedAnyConformityMatch({ mainType, mainTypeId });
  Conformities.deleteMany(match);
};

export const getRelatedConformity = async ({
  mainType,
  mainTypeId,
  relType,
}: {
  mainType: string;
  mainTypeId: string;
  relType: string;
}) => {
  if (!(mainType && mainTypeId)) {
    return [];
  }

  const match = getSavedAnyConformityMatch({ mainType, mainTypeId });

  const savedRelatedObjects = await Conformities.aggregate([
    match,
    {
      $project: {
        savedRelType: {
          $cond: {
            if: {
              $eq: ['$mainType', mainType],
            },
            then: '$relType',
            else: '$mainType',
          },
        },
        savedRelTypeId: {
          $cond: {
            if: {
              $eq: ['$mainType', mainType],
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
            $and: [{ mainType: relType }, { relStr: { $in: savedList } }],
          },
          {
            $and: [{ relType }, { mainStr: { $in: savedList } }],
          },
        ],
      },
    },
    {
      $project: {
        relTypeId: {
          $cond: {
            if: {
              $eq: ['$mainType', relType],
            },
            then: '$mainTypeId',
            else: '$relTypeId',
          },
        },
      },
    },
  ]);

  return relTypeIds.map(item => String(item.relTypeId));
};

export const changeConformity = async ({
  type,
  newTypeId,
  oldTypeIds,
}: {
  type: string;
  newTypeId: string;
  oldTypeIds: string[];
}) => {
  Conformities.updateMany(
    { $match: { $and: [{ mainType: type }, { mainTypeId: { $in: oldTypeIds } }] } },
    { mainTypeId: newTypeId },
  );

  Conformities.updateMany(
    { $match: { $and: [{ relType: type }, { relTypeId: { $in: oldTypeIds } }] } },
    { relTypeId: newTypeId },
  );
};

export const getFilterConformity = async ({
  mainType,
  mainTypeIds,
  relType,
}: {
  mainType: string;
  mainTypeIds: string[];
  relType: string;
}) => {
  const relTypeIds = await Conformities.aggregate([
    {
      $match: {
        $or: [
          {
            $and: [{ mainType }, { mainTypeId: { $in: mainTypeIds } }, { relType }],
          },
          {
            $and: [{ mainType: relType }, { relType: mainType }, { relTypeId: { $in: mainTypeIds } }],
          },
        ],
      },
    },
    {
      $project: {
        relTypeId: {
          $cond: {
            if: { $eq: ['$mainType', mainType] },
            then: '$relTypeId',
            else: '$mainTypeId',
          },
        },
      },
    },
  ]);
  return relTypeIds.map(item => String(item.relTypeId));
};
