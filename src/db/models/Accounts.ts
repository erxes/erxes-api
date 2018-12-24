import { Model, model } from 'mongoose';
import { accountSchema, IAccount, IAccountDocument } from './definitions/accounts';

export interface IAccountModel extends Model<IAccountDocument> {
  createAccount(doc: IAccount): Promise<IAccountDocument>;
  removeAccount(_id: string): void;
  getGmailCredentials(uid: string): Promise<IAccountDocument>;
}

export const loadClass = () => {
  class Account {
    /**
     * Create an integration account
     */
    public static async createAccount(doc: IAccount) {
      const { uid } = doc;

      const prevEntry = await Accounts.findOne({ uid });

      if (prevEntry) {
        return null;
      }

      return Accounts.create(doc);
    }
    /**
     * Remove integration account
     */
    public static removeAccount(_id) {
      return Accounts.deleteMany({ _id });
    }

    public static async getGmailCredentials(uid) {
      const account = await Accounts.findOne({ uid, kind: 'gmail' });

      if (!account) {
        throw new Error(`Account not found uid with ${uid}`);
      }

      return {
        access_token: account.token,
        refresh_token: account.tokenSecret,
        scope: account.scope,
        expire_date: account.expireDate,
        token_type: 'Bearer',
      };
    }
  }

  accountSchema.loadClass(Account);

  return accountSchema;
};

loadClass();

// tslint:disable-next-line
const Accounts = model<IAccountDocument, IAccountModel>('accounts', accountSchema);

export default Accounts;
