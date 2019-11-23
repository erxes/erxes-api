import { HTTPCache, RESTDataSource } from 'apollo-datasource-rest';
import { getEnv } from '../utils';

export default class AIAPI extends RESTDataSource {
  constructor() {
    super();

    const AI_API_DOMAIN = getEnv({ name: 'AI_API_DOMAIN' });

    this.baseURL = AI_API_DOMAIN;
    this.httpCache = new HTTPCache();
  }

  public didEncounterError(e) {
    const error = e.extensions || {};
    const { response } = error;
    const { body } = response || { body: e.message };

    if (e.code === 'ECONNREFUSED') {
      throw new Error('AI api is not running');
    }

    throw new Error(body);
  }

  public async getJobTypes() {
    return this.get('/get-job-types');
  }

  public async getJobs(args: { isNotified: boolean; type: string; limit?: number }) {
    return this.get(`/get-jobs?isNotified=${args.isNotified || ''}&type=${args.type}&limit=${args.limit || 10}`);
  }

  public async getJobDetail(_id: string) {
    return this.get(`/get-job-detail?_id=${_id}`);
  }
}
