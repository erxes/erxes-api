import { Segments } from '../../../db/models';
import { ICondition, ISegment, ISegmentDocument } from '../../../db/models/definitions/segments';
import { performCount } from '../../../elasticsearch';

export default {
  async segments(
    segment?: ISegment | null,
    _headSegment?: ISegmentDocument | null,
    _brandsMapping?: { [key: string]: string[] },
  ): Promise<any> {
    const query: any = { $and: [] };

    if (!segment || !segment.connector || !segment.conditions) {
      return {};
    }

    const childQuery = {};

    if (segment.conditions.length) {
      query.$and.push(childQuery);
    }

    return query.$and.length ? query : {};
  },
};

export const countBySegments = async (segment: ISegment) => {
  if (!segment || !segment.connector || !segment.conditions) {
    return 0;
  }

  let positive = [];
  let negative = [];

  for (const condition of segment.conditions) {
    elkConvertConditionToQuery(condition, { positive, negative });
  }

  // Fetching parent segment
  const embeddedParentSegment = await Segments.findOne({ _id: segment.subOf });
  const parentSegment = embeddedParentSegment;

  if (parentSegment) {
    const parentPositive = [];
    const parentNegative = [];

    for (const condition of parentSegment.conditions) {
      elkConvertConditionToQuery(condition, { positive: parentPositive, negative: parentNegative });
    }

    positive = [...positive, ...parentPositive];
    negative = [...negative, ...parentNegative];
  }

  console.log(JSON.stringify(positive), JSON.stringify(negative));

  const bool = {
    must: positive,
    must_not: negative,
  };

  return performCount('customers', { bool });
};

function elkConvertConditionToQuery(condition: ICondition, { positive, negative }) {
  const { operator, field, value = '' } = condition;

  const fixedValue = value.toLocaleLowerCase();

  // equal
  if (operator === 'e') {
    positive.push({
      term: {
        [field]: fixedValue,
      },
    });
  }

  // does not equal
  if (operator === 'dne') {
    negative.push({
      term: {
        [field]: fixedValue,
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
}
