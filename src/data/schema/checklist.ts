export const types = `
  type ChecklistItem {
    _id: String!
    checklistId: String
    isChecked: Boolean
    content: String
    order: Int
  }

  type Checklist {
    _id: String!
    contentType: String
    contentTypeId: String
    title: String
    createdUserId: String
    createdDate: Date
    items: [ChecklistItem]
    percent: Float
  }

  input OrderInput {
    _id: String
    order: Int
  }

  type ChecklistsState {
    complete: Float
    all: Float
  }
`;

export const queries = `
  checklists(contentType: String, contentTypeId: String): [Checklist]
  checklistDetail(_id: String!): Checklist
`;

export const mutations = `
  checklistsAdd(contentType: String, contentTypeId: String, title: String): Checklist
  checklistsEdit(_id: String!, title: String, contentType: String, contentTypeId: String,): Checklist
  checklistsRemove(_id: String!): Checklist
  updateOrderItems(orders: [OrderInput]): [ChecklistItem]

  checklistItemsAdd(checklistId: String, content: String, isChecked: Boolean, mentionedUserIds: [String], order: Int): ChecklistItem
  checklistItemsEdit(_id: String!, checklistId: String, content: String, isChecked: Boolean, mentionedUserIds: [String], order: Int): ChecklistItem
  checklistItemsRemove(_id: String!): ChecklistItem
`;
