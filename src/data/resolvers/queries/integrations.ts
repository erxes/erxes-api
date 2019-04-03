import { Accounts, Brands, Channels, Integrations, Tags } from '../../../db/models';
import { getConfig, getPageList } from '../../../trackers/facebook';
import { KIND_CHOICES, TAG_TYPES } from '../../constants';
import { moduleRequireLogin } from '../../permissions';
import { paginate } from './utils';

/**
 * Common helper for integrations & integrationsTotalCount
 */
const generateFilterQuery = async ({ kind, channelId, brandId, searchValue, tag }) => {
  const query: any = {};

  if (kind) {
    query.kind = kind;
  }

  // filter integrations by channel
  if (channelId) {
    const channel = await Channels.findOne({ _id: channelId });
    query._id = { $in: channel ? channel.integrationIds : [] };
  }

  // filter integrations by brand
  if (brandId) {
    query.brandId = brandId;
  }

  if (searchValue) {
    query.name = new RegExp(`.*${searchValue}.*`, 'i');
  }

  // filtering integrations by tag
  if (tag) {
    query.tagIds = tag;
  }

  return query;
};

const integrationQueries = {
  /**
   * Integrations list
   */
  async integrations(
    _root,
    args: {
      page: number;
      perPage: number;
      kind: string;
      searchValue: string;
      channelId: string;
      brandId: string;
      tag: string;
    },
  ) {
    const query = await generateFilterQuery(args);
    const integrations = paginate(Integrations.find(query), args);

    return integrations.sort({ name: 1 });
  },

  /**
   * Get one integration
   */
  integrationDetail(_root, { _id }: { _id: string }) {
    return Integrations.findOne({ _id });
  },

  /**
   * Get all integrations count. We will use it in pager
   */
  async integrationsTotalCount() {
    const counts = {
      total: 0,
      byTag: {},
      byChannel: {},
      byBrand: {},
      byKind: {},
    };

    const count = query => {
      return Integrations.find(query).countDocuments();
    };

    // Counting integrations by tag
    const tags = await Tags.find({ type: TAG_TYPES.INTEGRATION });

    for (const tag of tags) {
      counts.byTag[tag._id] = await count({ tagIds: tag._id });
    }

    // Counting integrations by kind
    for (const kind of KIND_CHOICES.ALL) {
      counts.byKind[kind] = await count({ kind });
    }

    // Counting integrations by channel
    const channels = await Channels.find({});

    for (const channel of channels) {
      counts.byChannel[channel._id] = await count({
        _id: { $in: channel.integrationIds },
      });
    }

    // Counting integrations by brand
    const brands = await Brands.find({});

    for (const brand of brands) {
      counts.byBrand[brand._id] = await count({ brandId: brand._id });
    }

    // Counting all integrations without any filter
    counts.total = await count({});

    return counts;
  },

  /**
   * Get facebook app list .env
   */
  integrationFacebookAppsList() {
    return getConfig().map(app => ({
      id: app.id,
      name: app.name,
    }));
  },

  /**
   * Get facebook pages by account id
   */
  async integrationFacebookPagesList(_root, { accountId }: { accountId: string }) {
    const account = await Accounts.findOne({ _id: accountId });

    if (!account) {
      throw new Error('Account not found');
    }

    const accessToken = account.token;

    return getPageList(accessToken);
  },
};

moduleRequireLogin(integrationQueries);

export default integrationQueries;
