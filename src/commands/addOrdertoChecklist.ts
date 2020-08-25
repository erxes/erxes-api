import * as dotenv from 'dotenv';
import { connect } from '../db/connection';
import { ChecklistItems, Checklists } from '../db/models';

dotenv.config();

interface IBulk {
  updateOne: {
    filter: {
      _id: string;
    };
    update: {
      $set: {
        order: number;
      };
    };
  };
}

const command = async () => {
  await connect();

  const checklistIds = await Checklists.find()
    .sort({ createdDate: 1 })
    .distinct('_id');

  const checklistBulkOptions: IBulk[] = [];

  checklistIds.map((id, index) => {
    checklistBulkOptions.push({
      updateOne: {
        filter: {
          _id: id,
        },
        update: {
          $set: {
            order: index + 1,
          },
        },
      },
    });
  });

  const checklistItems = await ChecklistItems.find({ checklistId: { $in: checklistIds } }).lean();

  const filteredItems: any = [];

  for (const checklistId of checklistIds) {
    filteredItems.push(checklistItems.filter(item => item.checklistId === checklistId));
  }

  const checklistItemBulkOptions: IBulk[] = [];

  for (const items of filteredItems) {
    items.map((item, idx) => {
      checklistItemBulkOptions.push({
        updateOne: {
          filter: {
            _id: item._id,
          },
          update: {
            $set: {
              order: idx + 1,
            },
          },
        },
      });
    });
  }

  await Checklists.bulkWrite(checklistBulkOptions);
  await ChecklistItems.bulkWrite(checklistItemBulkOptions);

  process.exit();
};

command();
