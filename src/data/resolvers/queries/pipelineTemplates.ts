import { PipelineTemplates } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions/wrappers';
import { paginate } from '../../utils';

const pipelineTemplateQueries = {
  /**
   *  Pipeline template list
   */
  pipelineTemplates(_root, pagintationArgs: { page: number; perPage: number }) {
    return paginate(PipelineTemplates.find(), pagintationArgs);
  },

  /**
   *  Pipeline template detail
   */
  pipelineTemplateDetail(_root, { _id }: { _id: string }) {
    return PipelineTemplates.findOne({ _id });
  },

  /**
   *  Pipeline template total count
   */
  pipelineTemplatesTotalCount() {
    return PipelineTemplates.find().countDocuments();
  },
};

moduleRequireLogin(pipelineTemplateQueries);

export default pipelineTemplateQueries;
