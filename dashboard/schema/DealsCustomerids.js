cube(`DealsCustomerids`, {
  sql: `SELECT * FROM erxes.\`deals_customerIds\``,

  joins: {},

  measures: {
    count: {
      type: `count`,
      drillMembers: [customerids],
    },
  },

  dimensions: {
    customerids: {
      sql: `${CUBE}.\`customerIds\``,
      type: `string`,
    },
  },
});
