import * as _ from 'underscore';
import { Segments } from '../../../db/models';
import { ICondition, ISegment } from '../../../db/models/definitions/segments';
import { fetchElk } from '../../../elasticsearch';

export const fetchBySegments = async (segment: ISegment, action: 'search' | 'count' = 'search'): Promise<any> => {
  if (!segment || !segment.conditions) {
    return [];
  }

  const propertyPositive = [
    {
      range: {
        profileScore: {
          gt: 0,
        },
      },
    },
  ];

  const propertyNegative = [
    {
      term: {
        status: 'Deleted',
      },
    },
  ];

  const eventPositive = [];
  const eventNegative = [];

  await generateQueryBySegment({ segment, propertyPositive, propertyNegative, eventNegative, eventPositive });

  let customerIdsByEvents = [];

  if (eventPositive.length > 0 || eventNegative.length > 0) {
    const eventsResponse = await fetchElk('search', 'events', {
      _source: 'customerId',
      query: {
        bool: {
          must: eventPositive,
          must_not: eventNegative,
        },
      },
    });

    customerIdsByEvents = eventsResponse.hits.hits.map(hit => hit._source.customerId);
  }

  if (action === 'count') {
    return {
      customerIdsByEvents,
      propertyPositive,
      propertyNegative,
    };
  }

  const customersResponse = await fetchElk('search', 'customers', {
    _source: '_id',
    query: {
      bool: {
        must: propertyPositive,
        must_not: propertyNegative,
      },
    },
  });

  const customerIdsByCustomers = customersResponse.hits.hits.map(hit => hit._id);

  let customerIds = customerIdsByCustomers.length ? customerIdsByCustomers : customerIdsByEvents;

  if (customerIdsByCustomers.length > 0 && customerIdsByEvents.length > 0) {
    customerIds = _.intersection(customerIdsByCustomers, customerIdsByEvents);
  }

  return customerIds;
};

const generateQueryBySegment = async (args: {
  propertyPositive;
  propertyNegative;
  eventPositive;
  eventNegative;
  segment: ISegment;
}) => {
  const { segment, propertyNegative, propertyPositive, eventNegative, eventPositive } = args;

  // Fetching parent segment
  const embeddedParentSegment = await Segments.findOne({ _id: segment.subOf });
  const parentSegment = embeddedParentSegment;

  if (parentSegment) {
    await generateQueryBySegment({ ...args, segment: parentSegment });
  }

  const propertyConditions: ICondition[] = [];
  const eventConditions: ICondition[] = [];

  for (const condition of segment.conditions) {
    if (condition.type === 'property') {
      propertyConditions.push(condition);
    }

    if (condition.type === 'event') {
      eventConditions.push(condition);
    }
  }

  for (const condition of propertyConditions) {
    elkConvertConditionToQuery({
      field: condition.propertyName || '',
      operator: condition.propertyOperator || '',
      value: condition.propertyValue || '',
      positive: propertyPositive,
      negative: propertyNegative,
    });
  }

  for (const condition of eventConditions) {
    const { eventAttributeFilters = [] } = condition;

    for (const filter of eventAttributeFilters) {
      elkConvertConditionToQuery({
        field: `attributes.${filter.name}`,
        operator: filter.operator,
        value: filter.value,
        positive: eventPositive,
        negative: eventNegative,
      });
    }
  }
};

function elkConvertConditionToQuery(args: { field: string; operator: string; value: string; positive; negative }) {
  const { field, operator, value, positive, negative } = args;

  const fixedValue = value.toLocaleLowerCase();

  // equal
  if (operator === 'e') {
    positive.push({
      term: {
        [`${field}.keyword`]: value,
      },
    });
  }

  // does not equal
  if (operator === 'dne') {
    negative.push({
      term: {
        [`${field}.keyword`]: value,
      },
    });
  }

  // contains
  if (operator === 'c') {
    positive.push({
      wildcard: {
        [field]: `*${fixedValue}*`,
      },
    });
  }

  // does not contains
  if (operator === 'dnc') {
    negative.push({
      wildcard: {
        [field]: `*${fixedValue}*`,
      },
    });
  }

  // greater than equal
  if (operator === 'igt') {
    positive.push({
      range: {
        [field]: {
          gte: fixedValue,
        },
      },
    });
  }

  // less then equal
  if (operator === 'ilt') {
    positive.push({
      range: {
        [field]: {
          lte: fixedValue,
        },
      },
    });
  }

  // is true
  if (operator === 'it') {
    positive.push({
      term: {
        [field]: true,
      },
    });
  }

  // is true
  if (operator === 'if') {
    positive.push({
      term: {
        [field]: false,
      },
    });
  }

  // is set
  if (operator === 'is') {
    positive.push({
      exists: {
        field,
      },
    });
  }

  // is not set
  if (operator === 'ins') {
    negative.push({
      exists: {
        field,
      },
    });
  }
}
