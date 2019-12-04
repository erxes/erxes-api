import { PipelineLabels, Stages, Users } from '.';

export default class BoardItemClass {
  protected userId: string = '';
  protected assignedUserIds: string[] = [];
  protected watchedUserIds: string[] = [];
  protected labelIds: string[] = [];
  protected stageId: string = '';
  protected initialStageId: string = '';
  protected modifiedBy: string = '';

  public getCreatedUser() {
    return Users.findOne({ _id: this.userId });
  }

  public getAssignedUsers() {
    return Users.find({ _id: { $in: this.assignedUserIds } }) || [];
  }

  public getWatchedUsers() {
    return Users.find({ _id: { $in: this.watchedUserIds } }) || [];
  }

  public getLabels() {
    return PipelineLabels.find({ _id: { $in: this.labelIds } }) || [];
  }

  public getStage() {
    return Stages.findOne({ _id: this.stageId });
  }

  public getInitialStage() {
    return Stages.findOne({ _id: this.initialStageId });
  }

  public getModifiedUser() {
    return Users.findOne({ _id: this.modifiedBy });
  }
}
