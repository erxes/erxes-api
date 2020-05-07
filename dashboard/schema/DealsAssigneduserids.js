cube(`DealsAssigneduserids`, {
  sql: `SELECT * FROM erxes.\`deals_assignedUserIds\``,
  
  joins: {
    
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [assigneduserids]
    }
  },
  
  dimensions: {
    assigneduserids: {
      sql: `${CUBE}.\`assignedUserIds\``,
      type: `string`
    }
  }
});
