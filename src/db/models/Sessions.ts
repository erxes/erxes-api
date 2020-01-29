import { Model, model } from 'mongoose';
import { ISession, ISessionDocument, sessionSchema } from './definitions/session';

export interface ISessionModel extends Model<ISessionDocument> {
  createSession(doc: ISession): Promise<ISessionDocument>;
}

export const loadClass = () => {
  class Session {
    public static createSession(doc: ISession) {
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
