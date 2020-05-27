import { tableSchema } from '../tablePrefix';

cube(`Deals`, {
  sql: `SELECT * FROM ${tableSchema()}.deals`,

  joins: {
    Stages: {
      sql: `${CUBE}.stageId = ${Stages}._id`,
      relationship: `belongsTo`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [initialstageid, name, stageid, createdat, closedate],
    },
  },

  segments: {
    wonDeals: {
      sql: `${CUBE.stageProbability} = 'Won'`,
      title: `Won`,
    },

    lostDeals: {
      sql: `${CUBE.stageProbability} = 'Lost'`,
      title: `lost`,
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },

    initialstageid: {
      sql: `${CUBE}.\`initialStageId\``,
      type: `string`,
      shown: false,
    },

    name: {
      sql: `name`,
      type: `string`,
    },

    stageName: {
      sql: `${Stages}.name`,
      type: `string`,
      title: `Stage name`,
    },

    stageProbability: {
      type: `string`,
      case: {
        when: [{ sql: `${Stages}.probability != ''`, label: { sql: `${Stages}.probability` } }],
        else: {},
      },
    },

    pipelineName: {
      sql: `${Stages.pipelineName}`,
      type: `string`,
      title: `Pipeline name`,
    },

    stageid: {
      sql: `${CUBE}.\`stageId\``,
      type: `string`,
      shown: false,
    },

    status: {
      sql: `status`,
      type: `string`,
    },

    createdat: {
      sql: `${CUBE}.\`createdAt\``,
      type: `time`,
      title: 'Created date',
    },

    closedate: {
      sql: `${CUBE}.\`closeDate\``,
      type: `time`,
      title: 'Closed date',
    },

    modifiedby: {
      sql: `${CUBE}.\`modifiedBy\``,
      type: `string`,
      shown: false,
    },
  },
});
