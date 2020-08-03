import { conformityQueryFields } from './common';

export const types = `
  type Car {
    _id: String!

    createdAt: Date
    modifiedAt: Date
    ownerId: String
    mergedIds: [String]
    description: String
    doNotDisturb: String
    owner: User
    tagIds: [String]

    customFieldsData: JSON

    customers: [Customer]
    companies: [Company]
    getTags: [Tag]

    plateNumber: String
    vinNumber: String
    colorCode: String

    manufactureBrand: String
    bodyType: String
    fuelType: String
    modelsName: String
    series: String
    gearBox: String

    vintageYear: Int
    importYear: Int
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
  ownerId: String,
  description: String
  doNotDisturb: String
  plateNumber: String
  vinNumber: String
  colorCode: String

  manufactureBrand: String
  bodyType: String
  fuelType: String
  modelsName: String
  series: String
  gearBox: String

  vintageYear: Int
  importYear: Int

  tagIds: [String]
  customFieldsData: JSON
`;

export const mutations = `
  carsAdd(${commonFields}): Car
  carsEdit(_id: String!, ${commonFields}): Car
  carsRemove(carIds: [String]): [String]
  carsMerge(carIds: [String], carFields: JSON) : Car
`;
