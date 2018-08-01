export const types = `
  type Company {
    _id: String!
    primaryName: String
    names: [String]
    size: Int
    website: String
    industry: String

    parentCompanyId: String
    email: String
    ownerId: String
    phone: String
    leadStatus: String
    lifecycleState: String
    businessType: String
    description: String
    employees: Int
    doNotDisturb: String
    links: CompanyLinks
    owner: User
    parentCompany: Company

    lastSeenAt: Date
    sessionCount: Int
    tagIds: [String]

    customFieldsData: JSON

    customers: [Customer]
    deals: [Deal]
    getTags: [Tag]
  }

  type CompaniesListResponse {
    list: [Company],
    totalCount: Float,
  }

  type CompanyLinks {
    linkedIn: String
    twitter: String
    facebook: String
    github: String
    youtube: String
    website: String
  }
`;

const queryParams = `
  page: Int,
  perPage: Int,
  segment: String,
  tag: String,
  ids: [String],
  searchValue: String
  leadStatus: String
`;

export const queries = `
  companiesMain(${queryParams}): CompaniesListResponse
  companies(${queryParams}): [Company]
  companyCounts(${queryParams}): JSON
  companyDetail(_id: String!): Company
  companiesExport(${queryParams}) : String
`;

const commonFields = `
  primaryName: String,
  names: [String]
  size: Int,
  website: String,
  industry: String,

  parentCompanyId: String,
  email: String,
  ownerId: String,
  phone: String,
  leadStatus: String,
  lifecycleState: String,
  businessType: String,
  description: String,
  employees: Int,
  doNotDisturb: String,
  links: JSON,

  lastSeenAt: Date,
  sessionCount: Int,
  tagIds: [String]
  customFieldsData: JSON
`;

export const mutations = `
  companiesAdd(${commonFields}): Company
  companiesEdit(_id: String!, ${commonFields}): Company
  companiesEditCustomers(_id: String!, customerIds: [String]): Company
  companiesRemove(companyIds: [String]): [String]
  companiesMerge(companyIds: [String], companyFields: JSON) : Company
`;
