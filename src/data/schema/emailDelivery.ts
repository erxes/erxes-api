export const types = `
  type EmailDelivery {
    _id: String!
    title: String
    subject: String
    content: String
    customerId: String
    fromUserId: String

    fromUserDetail: User
    customerDetail: Customer
  }
`;

export const queries = `
  emailDeliveryDetail(_id: String!): EmailDelivery
`;
