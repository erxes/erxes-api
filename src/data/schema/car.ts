import { conformityQueryFields } from './common';

export const types = `
  type CarCategory {
    _id: String!
    name: String
    description: String
    parentId: String
    code: String!
    order: String!

    isRoot: Boolean
    carCount: Int
  }

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
    categoryId: String

    category: CarCategory
    bodyType: String
    fuelType: String
    gearBox: String

    vintageYear: Float
    importYear: Float
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
  carCategories(parentId: String, searchValue: String): [CarCategory]
  carCategoriesTotalCount: Int
  carCategoryDetail(_id: String): CarCategory
`;

const commonFields = `
  ownerId: String,
  description: String
  doNotDisturb: String
  plateNumber: String
  vinNumber: String
  colorCode: String

  categoryId: String
  bodyType: String
  fuelType: String
  gearBox: String

  vintageYear: Float
  importYear: Float

  tagIds: [String]
  customFieldsData: JSON
`;

const carCategoryParams = `
  name: String!,
  code: String!,
  description: String,
  parentId: String,
`;

export const mutations = `
  carsAdd(${commonFields}): Car
  carsEdit(_id: String!, ${commonFields}): Car
  carsRemove(carIds: [String]): [String]
  carsMerge(carIds: [String], carFields: JSON) : Car
  carCategoriesAdd(${carCategoryParams}): CarCategory
  carCategoriesEdit(_id: String!, ${carCategoryParams}): CarCategory
  carCategoriesRemove(_id: String!): JSON
`;
