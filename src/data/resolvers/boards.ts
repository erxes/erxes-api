import { Pipelines } from '../../db/models';
import { IBoardDocument } from '../../db/models/definitions/boards';

export default {
  pipelines(board: IBoardDocument) {
    return Pipelines.find({ boardId: board._id });
  },
};
