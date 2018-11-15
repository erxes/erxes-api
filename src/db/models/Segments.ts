import { Model } from 'mongoose';
import { IModels } from '../../connectionResolver';
import { ISegment, ISegmentDocument, segmentSchema } from './definitions/segments';

export interface ISegmentModel extends Model<ISegmentDocument> {
  createSegment(doc: ISegment): Promise<ISegmentDocument>;
  updateSegment(_id: string, doc: ISegment): Promise<ISegmentDocument>;
  removeSegment(_id: string): void;
}

export const loadClass = (models: IModels) => {
  class Segment {
    /**
     * Create a segment
     * @param  {Object} segmentObj object
     * @return {Promise} Newly created segment object
     */
    public static createSegment(doc: ISegment) {
      const { Segments } = models;

      return Segments.create(doc);
    }

    /*
     * Update segment
     */
    public static async updateSegment(_id: string, doc: ISegment) {
      const { Segments } = models;

      await Segments.update({ _id }, { $set: doc });

      return Segments.findOne({ _id });
    }

    /*
     * Remove segment
     */
    public static async removeSegment(_id: string) {
      const { Segments } = models;

      const segmentObj = await Segments.findOne({ _id });

      if (!segmentObj) {
        throw new Error(`Segment not found with id ${_id}`);
      }

      return segmentObj.remove();
    }
  }

  segmentSchema.loadClass(Segment);

  return segmentSchema;
};
