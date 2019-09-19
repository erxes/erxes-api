export const types = `
  type ProductCategory {
    _id: String!
    name: String
    description: String
    parentId: String
    code: String!
    order: String!
    
    isRoot: Boolean
    productCount: Int
  }

  type Product {
    _id: String!
    categoryId: String
    name: String
    type: String
    description: String
    sku: String
    customFieldsData: JSON
    createdAt: Date

    categoryName: String
  }
`;

const productParams = `
  name: String,
  categoryId: String,
  type: String,
  description: String,
  sku: String,
  customFieldsData: JSON
`;

const productCategoryParams = `
  name: String!,
  code: String!,
  description: String,
  parentId: String,
`;

export const queries = `
  productCategories(parentId: String, searchValue: String): [ProductCategory]
  productCategoriesTotalCount(parentId: String): Int

  products(type: String, categoryId: String, searchValue: String, page: Int, perPage: Int ids: [String]): [Product]
  productsTotalCount(type: String): Int
  productDetail(_id: String): Product
`;

export const mutations = `
  productsAdd(${productParams}): Product
  productsEdit(_id: String!, ${productParams}): Product
  productsRemove(productIds: [String!]): JSON

  productCategoriesAdd(${productCategoryParams}): ProductCategory
  productCategoriesEdit(_id: String!, ${productCategoryParams}): ProductCategory
  productCategoriesRemove(_id: String!): JSON
`;
