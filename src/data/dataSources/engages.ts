import { RESTDataSource } from 'apollo-datasource-rest';
import { getEnv } from '../utils';

export default class EngagesAPI extends RESTDataSource {
  constructor() {
    super();

    const ENGAGES_API_DOMAIN = getEnv({ name: 'ENGAGES_API_DOMAIN' });

    this.baseURL = ENGAGES_API_DOMAIN;
  }

  public async list() {
    return this.get(`/engages/list`);
  }

  public async create(params) {
    return this.post(
      `/engages`, // path
      { ...params }, // request body
    );
  }
}
