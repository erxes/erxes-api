cube(`DealsAttachments`, {
  sql: `SELECT * FROM erxes.deals_attachments`,

  joins: {},

  measures: {
    count: {
      type: `count`,
      drillMembers: [attachmentsName],
    },
  },

  dimensions: {
    attachmentsName: {
      sql: `${CUBE}.\`attachments.name\``,
      type: `string`,
      title: `Attachments.name`,
    },

    attachmentsType: {
      sql: `${CUBE}.\`attachments.type\``,
      type: `string`,
      title: `Attachments.type`,
    },

    attachmentsUrl: {
      sql: `${CUBE}.\`attachments.url\``,
      type: `string`,
      title: `Attachments.url`,
    },
  },
});
