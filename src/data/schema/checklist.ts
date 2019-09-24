export const types = `
  type ChecklistItem {
    _id: String!
    checklistId: String
    content: String
    isChecked: Boolean
    createdUserId: String
    createdDate: Date
  }

  type Checklist {
    _id: String!
    contentType: String
    contentTypeId: String
    title: String
    createdUserId: String
    createdDate: Date
    checklistItems: [ChecklistItem]
    checklistPercent: Int
  }

`;

export const queries = `
  checklists(contentType: String, contentTypeId: String): [Checklist]
`;

export const mutations = `
  checklistsAdd(contentType: String, contentTypeId: String, title: String): Checklist
  checklistsEdit(_id: String!, title: String): Checklist
  checklistsRemove(_id: String!): Checklist

  checklistItemsAdd(checklistId: String, content: String, mentionedUserIds: [String]): ChecklistItem
  checklistItemsEdit(_id: String!, content: String, isChecked: Boolean, mentionedUserIds: [String]): ChecklistItem
  checklistItemsRemove(_id: String!): ChecklistItem
`;
