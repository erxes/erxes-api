import { Model, model } from 'mongoose';
import { IRobotEntryDocument, robotEntrySchema } from './definitions/robot';

export interface IRobotEntryModel extends Model<IRobotEntryDocument> {}

export const loadClass = () => {
  class RobotEntry {}

  robotEntrySchema.loadClass(RobotEntry);

  return robotEntrySchema;
};

loadClass();

// tslint:disable-next-line
const RobotEntries = model<IRobotEntryDocument, IRobotEntryModel>('robot_entries', robotEntrySchema);

export default RobotEntries;
