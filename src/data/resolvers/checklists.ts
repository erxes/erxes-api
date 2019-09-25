import { ChecklistItems } from '../../db/models';
import { IChecklistDocument } from '../../db/models/definitions/checklists';

export default {
  checklistItems(checklist: IChecklistDocument) {
    return ChecklistItems.find({ checklistId: checklist._id });
  },

  async checklistPercent(checklist: IChecklistDocument) {
    const checklistItems = await ChecklistItems.find({ checklistId: checklist._id });

    if (checklistItems.length === 0) {
      return 0;
    }

    const checkedItems = checklistItems.filter(item => {
      return item.isChecked;
    });

    return (checkedItems.length / checklistItems.length) * 100;
  },
};
