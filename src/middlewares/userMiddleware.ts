import * as jwt from 'jsonwebtoken';
import { USER_STATUSES } from '../data/constants';
import { Sessions, Users } from '../db/models';

/*
 * Finds user object by passed tokens
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const userMiddleware = async (req, _res, next) => {
  const token = req.cookies['auth-token'];

  if (token) {
    try {
      // verify user token and retrieve stored user information
      const { user } = jwt.verify(token, Users.getSecret());

      const loggedOut = await Sessions.findOne({
        userId: user._id,
        loginToken: token,
        status: USER_STATUSES.LOGGED_OUT,
      });

      if (loggedOut) {
        return next();
      }

      // save user in request
      req.user = user;
      req.user.loginToken = token;
    } catch (e) {
      return next();
    }
  }

  next();
};

export default userMiddleware;
