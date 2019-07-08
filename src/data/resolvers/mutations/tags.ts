import { Tags } from '../../../db/models';
import { ITag } from '../../../db/models/definitions/tags';
import { IUserDocument } from '../../../db/models/definitions/users';
import { checkPermission, requireLogin } from '../../permissions/wrappers';
import { putCreateLog, putDeleteLog, putUpdateLog } from '../../utils';
import { publishConversationsChanged } from './conversations';

interface ITagsEdit extends ITag {
  _id: string;
}

const tagMutations = {
  /**
   * Create new tag
   */
  async tagsAdd(_root, doc: ITag, { user }: { user: IUserDocument }) {
    const tag = await Tags.createTag(doc);

    if (tag) {
      await putCreateLog(
        {
          type: 'tag',
          newData: JSON.stringify(tag),
          object: JSON.stringify(tag),
          description: `${tag.name} has been created`,
        },
        user,
      );
    }

    return tag;
  },

  /**
   * Edit tag
   */
  async tagsEdit(_root, { _id, ...doc }: ITagsEdit, { user }: { user: IUserDocument }) {
    const tag = await Tags.findOne({ _id });
    const updated = await Tags.updateTag(_id, doc);

    if (tag) {
      await putUpdateLog(
        {
          type: 'tag',
          object: JSON.stringify(tag),
          newData: JSON.stringify(doc),
          description: `${tag.name} has been edited`,
        },
        user,
      );
    }

    return updated;
  },

  /**
   * Remove tag
   */
  async tagsRemove(_root, { ids }: { ids: string[] }, { user }: { user: IUserDocument }) {
    const tags = await Tags.find({ _id: { $in: ids } });
    const removed = await Tags.removeTag(ids);

    for (const tag of tags) {
      await putDeleteLog(
        {
          type: 'tag',
          object: JSON.stringify(tag),
          description: `${tag.name} has been removed`,
        },
        user,
      );
    }

    return removed;
  },

  /**
   * Attach a tag
   */
  tagsTag(_root, { type, targetIds, tagIds }: { type: string; targetIds: string[]; tagIds: string[] }) {
    if (type === 'conversation') {
      publishConversationsChanged(targetIds, 'tag');
    }

    return Tags.tagsTag(type, targetIds, tagIds);
  },
};

requireLogin(tagMutations, 'tagsTag');

checkPermission(tagMutations, 'tagsAdd', 'manageTags');
checkPermission(tagMutations, 'tagsEdit', 'manageTags');
checkPermission(tagMutations, 'tagsRemove', 'manageTags');

export default tagMutations;
