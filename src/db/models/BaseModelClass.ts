import { Users } from '.';

export default class BaseModelClass {
  protected userId: string = '';

  public getCreatedUser() {
    return Users.findOne({ _id: this.userId });
  }
}
