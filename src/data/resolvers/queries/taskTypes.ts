import { TaskTypes } from '../../../db/models';
import { checkPermission, moduleRequireLogin } from '../../permissions/wrappers';

const taskTypeQueries = {
  /**
   * Task type list
   */
  async taskTypes(_root) {
    return TaskTypes.find({}).sort({ name: 1 });
  },

  /**
   *  Task type detail
   */

  taskTypeDetail(_root, { _id }: { _id: string }) {
    return TaskTypes.findOne({ _id });
  },
};

moduleRequireLogin(taskTypeQueries);

checkPermission(taskTypeQueries, 'tasks', 'showTaskTypes', []);

export default taskTypeQueries;
