import { HTTPCache, RESTDataSource } from 'apollo-datasource-rest';
import { getEnv } from '../utils';

export default class EngagesAPI extends RESTDataSource {
  constructor() {
    super();

    const CRONS_API_DOMAIN = getEnv({ name: 'CRONS_API_DOMAIN' });

    this.baseURL = CRONS_API_DOMAIN;
    this.httpCache = new HTTPCache();
  }

  public async createSchedule(engageMessage) {
    return this.post(`/create-schedule`, engageMessage);
  }

  public async updateOrRemoveSchedule(_id, update) {
    return this.post(`/update-or-remove-schedule`, { _id, update });
  }
}
