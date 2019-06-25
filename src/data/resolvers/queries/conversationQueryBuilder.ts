import * as _ from 'underscore';
import { Channels, Integrations } from '../../../db/models';
import { CONVERSATION_STATUSES } from '../../constants';
import { fixDate } from '../../utils';

interface IIn {
  $in: string[];
}

interface IExists {
  $exists: boolean;
}

export interface IListArgs {
  limit?: number;
  channelId?: string;
  status?: string;
  unassigned?: string;
  brandId?: string;
  tag?: string;
  integrationType?: string;
  participating?: string;
  starred?: string;
  ids?: string[];
  startDate?: string;
  endDate?: string;
  only?: string;
}

interface IUserArgs {
  _id: string;
  starredConversationIds?: string[];
}

interface IIntersectIntegrationIds {
  integrationId: IIn;
}

interface IUnassignedFilter {
  assignedUserId: IExists;
}

interface IDateFilter {
  createdAt: {
    $gte: Date;
    $lte: Date;
  };
}

export default class Builder {
  public params: IListArgs;
  public user: IUserArgs;
  public queries: any;
  public unassignedQuery?: IUnassignedFilter;

  constructor(params: IListArgs, user: IUserArgs) {
    this.params = params;
    this.user = user;
  }

  public defaultFilters(): { [index: string]: {} } {
    let statusFilter = this.statusFilter([CONVERSATION_STATUSES.NEW, CONVERSATION_STATUSES.OPEN]);

    if (this.params.status === 'closed') {
      statusFilter = this.statusFilter([CONVERSATION_STATUSES.CLOSED]);
    }

    return {
      ...statusFilter,
      // exclude engage messages if customer did not reply
      $or: [
        {
          userId: { $exists: true },
          messageCount: { $gt: 1 },
        },
        {
          userId: { $exists: false },
        },
      ],
    };
  }

  public intersectIntegrationIds(...queries: any[]): { integrationId: IIn } {
    // filter only queries with $in field
    const withIn = queries.filter(q => q.integrationId && q.integrationId.$in && q.integrationId.$in.length > 0);

    // [{$in: ['id1', 'id2']}, {$in: ['id3', 'id1', 'id4']}]
    const $ins = _.pluck(withIn, 'integrationId');

    // [['id1', 'id2'], ['id3', 'id1', 'id4']]
    const nestedIntegrationIds = _.pluck($ins, '$in');

    // ['id1']
    const integrationids: any = _.intersection(...nestedIntegrationIds);

    return {
      integrationId: { $in: integrationids },
    };
  }

  /*
   * find integrationIds from channel && brand
   */
  public async integrationsFilter(): Promise<IIntersectIntegrationIds> {
    const channelFilter = {
      memberIds: this.user._id,
    };

    // find all posssible integrations
    let availIntegrationIds: any = [];

    const channels = await Channels.find(channelFilter);

    channels.forEach(channel => {
      availIntegrationIds = _.union(availIntegrationIds, channel.integrationIds || '');
    });

    const nestedIntegrationIds: any = [{ integrationId: { $in: availIntegrationIds } }];

    // filter by channel
    if (this.params.channelId) {
      const channelQuery = await this.channelFilter(this.params.channelId);
      nestedIntegrationIds.push(channelQuery);
    }

    // filter by brand
    if (this.params.brandId) {
      const brandQuery = await this.brandFilter(this.params.brandId);
      nestedIntegrationIds.push(brandQuery);
    }

    return this.intersectIntegrationIds(...nestedIntegrationIds);
  }

  // filter by channel
  public async channelFilter(channelId: string): Promise<{ integrationId: IIn }> {
    const channel = await Channels.findOne({ _id: channelId });
    if (channel && channel.integrationIds) {
      return {
        integrationId: { $in: channel.integrationIds },
      };
    } else {
      return { integrationId: { $in: [] } };
    }
  }

  // filter by brand
  public async brandFilter(brandId: string): Promise<{ integrationId: IIn }> {
    const integrations = await Integrations.find({ brandId });
    const integrationIds = _.pluck(integrations, '_id');

    return {
      integrationId: { $in: integrationIds },
    };
  }

  // filter all unassigned
  public unassignedFilter(): IUnassignedFilter {
    this.unassignedQuery = {
      assignedUserId: { $exists: false },
    };

    return this.unassignedQuery;
  }

  // filter by participating
  public participatingFilter(): { participatedUserIds: IIn } {
    return {
      participatedUserIds: { $in: [this.user._id] },
    };
  }

  // filter by starred
  public starredFilter(): { _id: IIn | { $in: any[] } } {
    let ids: any = [];

    if (this.user) {
      ids = this.user.starredConversationIds || [];
    }

    return {
      _id: { $in: ids },
    };
  }

  public statusFilter(statusChoices: string[]): { status: IIn } {
    return {
      status: { $in: statusChoices },
    };
  }

  // filter by integration type
  public async integrationTypeFilter(integrationType: string): Promise<{ $and: IIntersectIntegrationIds[] }> {
    const integrations = await Integrations.find({ kind: integrationType });

    return {
      $and: [
        // add channel && brand filter
        this.queries.integrations,

        // filter by integration type
        { integrationId: { $in: _.pluck(integrations, '_id') } },
      ],
    };
  }

  // filter by tag
  public tagFilter(tagId: string): { tagIds: string[] } {
    return {
      tagIds: [tagId],
    };
  }

  public dateFilter(startDate: string, endDate: string): IDateFilter {
    return {
      createdAt: {
        $gte: fixDate(startDate),
        $lte: fixDate(endDate),
      },
    };
  }

  /*
   * prepare all queries. do not do any action
   */
  public async buildAllQueries(): Promise<void> {
    this.queries = {
      default: this.defaultFilters(),
      starred: {},
      status: {},
      unassigned: {},
      tag: {},
      channel: {},
      integrationType: {},

      // find it using channel && brand
      integrations: {},

      participating: {},
      createdAt: {},
    };

    // filter by channel
    if (this.params.channelId) {
      this.queries.channel = await this.channelFilter(this.params.channelId);
    }

    // filter by channelId & brandId
    this.queries.integrations = await this.integrationsFilter();

    // unassigned
    if (this.params.unassigned) {
      this.queries.unassigned = this.unassignedFilter();
    }

    // participating
    if (this.params.participating) {
      this.queries.participating = this.participatingFilter();
    }

    // starred
    if (this.params.starred) {
      this.queries.starred = this.starredFilter();
    }

    // filter by status
    if (this.params.status) {
      this.queries.status = this.statusFilter([this.params.status]);
    }

    // filter by tag
    if (this.params.tag) {
      this.queries.tag = this.tagFilter(this.params.tag);
    }

    // filter by integration type
    if (this.params.integrationType) {
      this.queries.integrationType = await this.integrationTypeFilter(this.params.integrationType);
    }

    if (this.params.startDate && this.params.endDate) {
      this.queries.createdAt = this.dateFilter(this.params.startDate, this.params.endDate);
    }
  }

  public mainQuery(): any {
    return {
      ...this.queries.default,
      ...this.queries.integrations,
      ...this.queries.integrationType,
      ...this.queries.unassigned,
      ...this.queries.participating,
      ...this.queries.status,
      ...this.queries.starred,
      ...this.queries.tag,
      ...this.queries.createdAt,
    };
  }
}
