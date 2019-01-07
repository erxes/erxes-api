/**
 * Converts dateField into string using timeFormat
 * @param fieldName
 * @param timeFormat
 */
export const getDateFieldAsStr = async ({ fieldName = '$createdAt', timeFormat = '%Y-%m-%d' }): Promise<any> => {
  return {
    $dateToString: {
      format: timeFormat,
      date: fieldName,
    },
  };
};
