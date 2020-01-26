export const types = `
  input EventAttributeFilter {
    field: String,
    operator: String,
    value: String,
  }

  input SegmentCondition {
    type: String,

    propertyName: String,
    propertyOperator: String,
    propertyValue: String,

    eventName: String,
    eventAttributeFilters: [EventAttributeFilter],
  }

  type Segment {
    _id: String!
    contentType: String!
    name: String!
    description: String
    subOf: String
    color: String
    connector: String
    conditions: JSON

    getSubSegments: [Segment]
  }
`;

export const queries = `
  segments(contentType: String!): [Segment]
  segmentDetail(_id: String): Segment
  segmentsGetHeads: [Segment]
  segmentsEventNames: [String]
`;

const commonFields = `
  name: String!,
  description: String,
  subOf: String,
  color: String,
  connector: String,
  conditions: [SegmentCondition]
`;

export const mutations = `
  segmentsAdd(contentType: String!, ${commonFields}): Segment
  segmentsEdit(_id: String!, ${commonFields}): Segment
  segmentsRemove(_id: String!): JSON
`;
