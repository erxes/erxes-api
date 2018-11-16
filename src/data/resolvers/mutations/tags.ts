import { IContext } from '../../../connectionResolver';
import { ITag } from '../../../db/models/definitions/tags';
import { moduleRequireLogin } from '../../permissions';
import { publishConversationsChanged } from './conversations';

interface ITagsEdit extends ITag {
  _id: string;
}

const tagMutations = {
  /**
   * Create new tag
   */
  tagsAdd(_root, doc: ITag, { models: { Tags } }: IContext) {
    return Tags.createTag(doc);
  },

  /**
   * Edit tag
   */
  tagsEdit(_root, { _id, ...doc }: ITagsEdit, { models: { Tags } }: IContext) {
    return Tags.updateTag(_id, doc);
  },

  /**
   * Remove tag
   */
  tagsRemove(_root, { ids }: { ids: string[] }, { models: { Tags } }: IContext) {
    return Tags.removeTag(ids);
  },

  /**
   * Attach a tag
   */
  tagsTag(
    _root,
    { type, targetIds, tagIds }: { type: string; targetIds: string[]; tagIds: string[] },
    { models: { Tags } }: IContext,
  ) {
    if (type === 'conversation') {
      publishConversationsChanged(targetIds, 'tag');
    }

    return Tags.tagsTag(type, targetIds, tagIds);
  },
};

moduleRequireLogin(tagMutations);

export default tagMutations;
