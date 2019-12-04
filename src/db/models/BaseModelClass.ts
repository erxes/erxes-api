import { Users } from '.';

export default class BoardItemClass {
  protected userId: string = '';

  public getCreatedUser() {
    return Users.findOne({ _id: this.userId });
  }
}
