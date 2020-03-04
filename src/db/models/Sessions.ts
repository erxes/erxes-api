import { Model, model } from 'mongoose';
import { ISession, ISessionDocument, sessionSchema } from './definitions/session';

export interface ISessionModel extends Model<ISessionDocument> {
  createSession(doc: ISession): Promise<ISessionDocument>;
}

export const loadClass = () => {
  class Session {
    public static async createSession(doc: ISession) {
      const exists = await Sessions.findOne({
        userId: doc.userId,
        loginToken: doc.loginToken,
        ipAddress: doc.ipAddress,
      });

      if (exists) {
        return exists;
      }

      return Sessions.create({ ...doc, createdAt: new Date() });
    }
  }

  sessionSchema.loadClass(Session);

  return sessionSchema;
};

loadClass();

// tslint:disable-next-line
const Sessions = model<ISessionDocument, ISessionModel>('sessions', sessionSchema);

export default Sessions;
