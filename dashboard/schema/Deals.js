cube(`Deals`, {
  sql: `SELECT * FROM erxes.deals`,

  joins: {},

  measures: {
    count: {
      type: `count`,
    },
  },

  dimensions: {
    paymentsdataBankCurrency: {
      sql: `${CUBE}.\`paymentsData.bank.currency\``,
      type: `string`,
      title: `Paymentsdata.bank.currency`,
    },

    paymentsdata: {
      sql: `${CUBE}.\`paymentsData\``,
      type: `string`,
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
  },
});
