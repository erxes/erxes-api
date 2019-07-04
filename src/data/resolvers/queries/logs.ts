import { fetchLogs } from '../../utils';

const logQueries = {
  /**
   * Fetches logs from logs api server
   * @param {string} params.start Start date
   * @param {string} params.end End date
   * @param {string} params.userId User
   * @param {string} params.action Action (one of create|update|delete)
   * @param {string} params.page
   * @param {string} params.perPage
   */
  logs(_root, { start, end, userId, action, page, perPage }) {
    return fetchLogs({
      body: {
        start,
        end,
        userId,
        action,
        page,
        perPage,
      },
    });
  },
};

export default logQueries;
