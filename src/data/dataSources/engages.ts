import { HTTPCache, RESTDataSource } from 'apollo-datasource-rest';
import { getEnv } from '../utils';

export default class EngagesAPI extends RESTDataSource {
  constructor() {
    super();

    const ENGAGES_API_DOMAIN = getEnv({ name: 'ENGAGES_API_DOMAIN' });

    this.baseURL = ENGAGES_API_DOMAIN;
    this.httpCache = new HTTPCache();
  }

  public async send(params) {
    return this.post(
      `/engages/send`, // path
      params, // request body
    );
  }

  public async engagesConfigDetail() {
    return this.get(`/configs/detail`);
  }

  public async engagesConfigSave(params) {
    return this.post(`/configs/save`, params);
  }

  public async engagesStats(engageMessageId) {
    return this.get(`/deliveryReports/statsList/${engageMessageId}`);
  }

  public async engagesList(params, user) {
    return this.post(`/engages/list`, { ...params, user });
  }

  public async engagesDetail(engageMessageId) {
    return this.get(`/engages/detail/${engageMessageId}`);
  }

  public async engagesUpdate(engageMessageId, doc) {
    return this.post(`/engages/update/${engageMessageId}`, doc);
  }

  public async engagesRemove(engageMessageId) {
    return this.delete(`/engages/remove/${engageMessageId}`);
  }

  public async engagesSetLive(engageMessageId) {
    return this.post(`/engages/setLive/${engageMessageId}`);
  }

  public async engagesSetPause(engageMessageId) {
    return this.post(`/engages/setPause/${engageMessageId}`);
  }

  public async engagesChangeCustomer({ newCustomerId, customerIds }: { newCustomerId: string; customerIds: string[] }) {
    return this.post(`/engages/changeCustomer`, { newCustomerId, customerIds });
  }

  public async engagesCount(params) {
    return this.post(`/engages/count`, params);
  }

  public async engagesTotalCount(params, user) {
    return this.post(`/engages/totalCount`, { ...params, user });
  }

  public async engagesTag(targetIds, tagIds) {
    return this.post(`/engages/tag`, { targetIds, tagIds });
  }
}
