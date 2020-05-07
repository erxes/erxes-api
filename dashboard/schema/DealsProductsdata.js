cube(`DealsProductsdata`, {
  sql: `SELECT * FROM erxes.\`deals_productsData\``,

  joins: {
    Integrations: {
      sql: `${CUBE}._id = ${Deals}._id`,
      relationship: `belongsTo`,
    },
  },

  segments: {
    onlyRegisteredByIntegrations: {
      sql: `${productsdataAmount} != ''`,
    },
  },

  measures: {
    productsdataAmountSum: {
      sql: `${CUBE}.\`productsData.amount\``,
      type: `sum`,
      title: `Amount`,
    },

    productsdataAmountAvg: {
      sql: `${CUBE}.\`productsData.amount\``,
      type: `avg`,
      title: `Avarage`,
    },

    productsdataDiscountSum: {
      sql: `${CUBE}.\`productsData.discount\``,
      type: `sum`,
      title: `Discount`,
    },

    productsdataUnitpriceSum: {
      sql: `${CUBE}.\`productsData.unitPrice\``,
      type: `sum`,
      title: `Unitprice`,
    },
  },

  dimensions: {
    _id: {
      sql: `CONCAT(${CUBE}._id)`,
      type: `string`,
      primaryKey: true,
    },

    integrationKind: {
      type: `string`,
      sql: `${Deals}.name`,
    },

    productsdataProductid: {
      sql: `${CUBE}.\`productsData.productId\``,
      type: `string`,
      title: `Productsdata.productid`,
    },

    productsdataAmount: {
      sql: `${CUBE}.\`productsData.amount\``,
      type: `string`,
      title: `Productsdata.amount`,
    },

    productsdataAssignuserid: {
      sql: `${CUBE}.\`productsData.assignUserId\``,
      type: `string`,
      title: `Productsdata.assignuserid`,
    },

    productsdataCurrency: {
      sql: `${CUBE}.\`productsData.currency\``,
      type: `string`,
      title: `Productsdata.currency`,
    },

    productsdataId: {
      sql: `${CUBE}.\`productsData._id\``,
      type: `string`,
      title: `Productsdata. Id`,
    },

    productsdataUom: {
      sql: `${CUBE}.\`productsData.uom\``,
      type: `string`,
      title: `Productsdata.uom`,
    },
  },
});
