export const types = `
  type Checklist {
    _id: String!
    contentType: String!
    contentTypeId: String
    title: String
    createdUserId: String
    createdDate: Date

    createdUser: User
  }

  type ChecklistItem {
    _id: String!
    checklistId: String!
    content: String!
    isChecked: Boolean!
    createdUserId: String
    createdDate: Date

    createdUser: User
  }
`;

export const queries = `
  checklists(contentType: String!, contentTypeId: String): [Checklist]
  checklistItems(checklistId: String!): [ChecklistItem]
`;

export const mutations = `
  checklistsAdd(contentType: String!, contentTypeId: String, title: String): Checklist
  checklistsEdit(_id: String!, content: String): Checklist
  checklistsRemove(_id: String!): Checklist

  checklistItemsAdd(checklistId: String!, content: String): ChecklistItem
  checklistItemsEdit(_id: String!, content: String, isChecked: Boolean): ChecklistItem
  checklistItemsRemove(_id: String!): ChecklistItem
`;
