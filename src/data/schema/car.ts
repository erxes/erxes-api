import { conformityQueryFields } from './common';

export const types = `
  type Car {
    _id: String!

    createdAt: Date
    modifiedAt: Date
    avatar: String

    size: Int
    website: String
    industry: String
    plan: String
    parentCarId: String
    ownerId: String
    mergedIds: [String]

    names: [String]
    primaryName: String
    emails: [String]
    primaryEmail: String
    phones: [String]
    primaryPhone: String

    businessType: String
    description: String
    doNotDisturb: String
    links: JSON
    owner: User
    parentCar: Car

    tagIds: [String]

    customFieldsData: JSON

    customers: [Customer]
    getTags: [Tag]
    code: String
  }

  type CarsListResponse {
    list: [Car],
    totalCount: Float,
  }
`;

const queryParams = `
  page: Int
  perPage: Int
  segment: String
  tag: String
  ids: [String]
  searchValue: String
  sortField: String
  sortDirection: Int
  brand: String
  ${conformityQueryFields}
`;

export const queries = `
  carsMain(${queryParams}): CarsListResponse
  cars(${queryParams}): [Car]
  carCounts(${queryParams}, only: String): JSON
  carDetail(_id: String!): Car
`;

const commonFields = `
  avatar: String,

  primaryName: String,
  names: [String]

  primaryPhone: String,
  phones: [String],

  primaryEmail: String,
  emails: [String],

  size: Int,
  website: String,
  industry: String,

  parentCarId: String,
  email: String,
  ownerId: String,
  businessType: String,
  description: String,
  doNotDisturb: String,
  links: JSON,

  tagIds: [String]
  customFieldsData: JSON
  code: String
`;

export const mutations = `
  carsAdd(${commonFields}): Car
  carsEdit(_id: String!, ${commonFields}): Car
  carsRemove(carIds: [String]): [String]
  carsMerge(carIds: [String], carFields: JSON) : Car
`;
