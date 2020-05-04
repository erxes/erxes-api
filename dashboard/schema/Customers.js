const xxa = val => {
  console.log(val);
};

cube(`Customers`, {
  sql: `SELECT * FROM erxes.customers`,

  joins: {
    Integrations: {
      sql: `${CUBE}.integrationId = ${Integrations}._id`,
      relationship: `belongsTo`,
    },
  },

  measures: {
    count: {
      type: `count`,
    },
  },

  segments: {
    onlyRegisteredByIntegrations: {
      sql: `${CUBE}.integrationId != '' or ${CUBE}.integrationId !='null'`,
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },

    integrationName: {
      type: `string`,
      case: {
        when: [{ sql: `${CUBE}.integrationId != ''`, label: { sql: `${Integrations}.name` } }],
        else: {},
      },
    },

    integrationKind: {
      type: `string`,
      case: {
        when: [{ sql: `${CUBE}.integrationId != ''`, label: { sql: `${Integrations}.kind` } }],
        else: {},
      },
    },

    emailvalidationstatus: {
      sql: `${CUBE}.\`emailValidationStatus\``,
      type: `string`,
    },

    leadstatus: {
      type: `string`,
      case: {
        when: [{ sql: `${CUBE}.leadStatus != ''`, label: { sql: `${CUBE}.leadStatus` } }],
        else: {},
      },
    },

    lifecyclestate: {
      type: `string`,
      case: {
        when: [{ sql: `${CUBE}.lifecycleState != ''`, label: { sql: `${CUBE}.lifecycleState` } }],
        else: {},
      },
    },

    locationCity: {
      sql: `${CUBE}.\`location.city\``,
      type: `string`,
      title: `Location.city`,
    },

    locationCountry: {
      sql: `${CUBE}.\`location.country\``,
      type: `string`,
      title: `Location.country`,
    },

    status: {
      sql: `status`,
      type: `string`,
    },

    createdat: {
      sql: `${CUBE}.\`createdAt\``,
      type: `time`,
    },

    modifiedat: {
      sql: `${CUBE}.\`modifiedAt\``,
      type: `time`,
    },
  },
  preAggregations: {
    count: {
      type: `rollup`,
      measureReferences: [Customers.count],
      dimensionReferences: [status],
      timeDimensionReference: count,
      granularity: `day`,
      refreshKey: {
        every: `1 minute`,
      },
    },
  },
});
