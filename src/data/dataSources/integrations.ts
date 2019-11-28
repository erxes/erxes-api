import { HTTPCache, RESTDataSource } from 'apollo-datasource-rest';
import { getEnv } from '../utils';

export default class IntegrationsAPI extends RESTDataSource {
  constructor() {
    super();

    const INTEGRATIONS_API_DOMAIN = getEnv({ name: 'INTEGRATIONS_API_DOMAIN' });

    this.baseURL = INTEGRATIONS_API_DOMAIN;
    this.httpCache = new HTTPCache();
  }

  public didEncounterError(e) {
    const error = e.extensions || {};
    const { response } = error;
    const { body } = response || { body: e.message };

    if (e.code === 'ECONNREFUSED') {
      throw new Error('Integrations api is not running');
    }

    throw new Error(body);
  }

  public async createIntegration(kind, params) {
    return this.post(`/${kind}/create-integration`, params);
  }

  public async removeIntegration(params) {
    return this.post('/integrations/remove', params);
  }

  public async createAccount(params) {
    return this.post('/nylas/auth/callback', params);
  }

  public async removeAccount(params) {
    return this.post('/accounts/remove', params);
  }

  public async replyFacebook(params) {
    return this.post('/facebook/reply', params);
  }

  public async replyFacebookPost(params) {
    return this.post('/facebook/reply-post', params);
  }

  public async replyChatfuel(params) {
    return this.post('/chatfuel/reply', params);
  }

  public async sendEmail(kind, params) {
    return this.post(`/${kind}/send`, params);
  }

  public async fetchApi(path, params) {
    return this.get(path, params);
  }

  public async replyTwitterDm(params) {
    return this.post('/twitter/reply', params);
  }
}
