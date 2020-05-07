cube(`DealsCompanyids`, {
  sql: `SELECT * FROM erxes.\`deals_companyIds\``,
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [companyids]
    }
  },
  
  dimensions: {
    companyids: {
      sql: `${CUBE}.\`companyIds\``,
      type: `string`
    }
  }
});
