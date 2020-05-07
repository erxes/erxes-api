cube(`Deals`, {
  sql: `SELECT * FROM erxes.deals`,

  joins: {
    DealsProductsdata: {
      sql: `${CUBE}._id = ${DealsProductsdata}._id`,
      relationship: `hasMany`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [initialstageid, name, stageid, createdat, closedate],
    },

    productsdataAmountSum: {
      sql: `${productsdataAmount}`,
      type: `sum`,
      title: `Productsdata.amount`,
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },

    productsdataAmount: {
      sql: `${DealsProductsdata.productsdataAmount}`,
      type: `number`,
      subQuery: true,
    },

    description: {
      sql: `description`,
      type: `string`,
    },

    initialstageid: {
      sql: `${CUBE}.\`initialStageId\``,
      type: `string`,
    },

    name: {
      sql: `name`,
      type: `string`,
    },

    priority: {
      sql: `priority`,
      type: `string`,
    },

    stageid: {
      sql: `${CUBE}.\`stageId\``,
      type: `string`,
    },

    status: {
      sql: `status`,
      type: `string`,
    },

    assignedUserIds: {
      sql: `${CUBE}.\`assignedUserIds\``,
      type: `string`,
    },

    productsData: {
      sql: `${CUBE}.\`productsData\``,
      type: `geo`,
      title: `xaxaxa`,
    },

    createdat: {
      sql: `${CUBE}.\`createdAt\``,
      type: `time`,
    },

    closedate: {
      sql: `${CUBE}.\`closeDate\``,
      type: `time`,
    },

    modifiedat: {
      sql: `${CUBE}.\`modifiedAt\``,
      type: `time`,
    },

    modifiedby: {
      sql: `${CUBE}.\`modifiedBy\``,
      type: `string`,
    },
  },
});
