import { Tags } from '../../../db/models';
import { IUserDocument } from '../../../db/models/definitions/users';
import { checkPermission, requireLogin } from '../../permissions/wrappers';

interface IListArgs {
  kind?: string;
  status?: string;
  tag?: string;
  ids?: string[];
  brandIds?: string[];
  segmentIds?: string[];
  tagIds?: string[];
  page?: number;
  perPage?: number;
}

const engageQueries = {
  /**
   * Group engage messages counts by kind, status, tag
   */
  async engageMessageCounts(
    _root,
    { name, kind, status }: { name: string; kind: string; status: string },
    { user, dataSources }: { user: IUserDocument; dataSources: any },
  ) {
    if (name === 'kind' || name === 'status') {
      return dataSources.EngagesAPI.engagesCount({ name, kind, user });
    }

    if (name === 'tag') {
      const tags = await Tags.find({ type: 'engageMessage' });

      const tagIds = tags.map(tag => tag._id);

      return dataSources.EngagesAPI.engagesCount({ name, kind, status, user, tagIds });
    }
  },

  /**
   * Engage messages list
   */
  engageMessages(_root, args: IListArgs, { user, dataSources }: { user: IUserDocument; dataSources: any }) {
    return dataSources.EngagesAPI.engagesList(args, user);
  },

  /**
   * Get one message
   */
  engageMessageDetail(_root, { _id }: { _id: string }, { dataSources }) {
    return dataSources.EngagesAPI.engagesDetail(_id);
  },

  /**
   * Get all messages count. We will use it in pager
   */
  engageMessagesTotalCount(_root, args: IListArgs, { user, dataSources }: { user: IUserDocument; dataSources }) {
    return dataSources.EngagesAPI.engagesTotalCount(args, user);
  },
};

requireLogin(engageQueries, 'engageMessagesTotalCount');
requireLogin(engageQueries, 'engageMessageCounts');
requireLogin(engageQueries, 'engageMessageDetail');

checkPermission(engageQueries, 'engageMessages', 'showEngagesMessages', []);

export default engageQueries;
