cube(`DealsLabelids`, {
  sql: `SELECT * FROM erxes.\`deals_labelIds\``,
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [labelids]
    }
  },
  
  dimensions: {
    labelids: {
      sql: `${CUBE}.\`labelIds\``,
      type: `string`
    }
  }
});
