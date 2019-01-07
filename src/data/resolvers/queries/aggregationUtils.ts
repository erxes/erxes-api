/**
 * Converts dateField into string using timeFormat
 * @param fieldName
 * @param timeFormat
 */
export const getDateFieldAsStr = async ({
  fieldName = '$createdAt',
  timeFormat = '%Y-%m-%d',
}): Promise<{
  $dateToString: {
    format: string;
    date: string;
  };
}> => {
  return {
    $dateToString: {
      format: timeFormat,
      date: fieldName,
    },
  };
};
