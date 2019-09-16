export const types = `
  type ProductCategory {
    _id: String!
    name: String
    description: String
    parentId: String
  }

  type Product {
    _id: String!
    categoryId: String
    name: String
    type: String
    description: String
    sku: String
    createdAt: Date
  }
`;

const productParams = `
  categoryId: String,
  name: String!,
  type: String,
  description: String,
  sku: String,
`;

const productCategoryParams = `
  name: String!,
  description: String,
  parentId: String,
`;

export const queries = `
  productCategories(parentId: String, searchValue: String): [ProductCategory]
  productCategoriesTotalCount(parentId: String): Int

  products(type: String, categoryId: String, searchValue: String, page: Int, perPage: Int ids: [String]): [Product]
  productsTotalCount(type: String): Int
`;

export const mutations = `
  productsAdd(${productParams}): Product
  productsEdit(_id: String!, ${productParams}): Product
  productsRemove(_id: String!): JSON

  productCategoriesAdd(${productCategoryParams}): ProductCategory
  productCategoriesEdit(_id: String!, ${productCategoryParams}): ProductCategory
  productCategoriesRemove(_id: String!): JSON
`;
