import * as bcrypt from 'bcryptjs';
import * as faker from 'faker';
import * as moment from 'moment';
import utils from '../data/utils';
import { graphqlRequest } from '../db/connection';
import { brandFactory, channelFactory, userFactory } from '../db/factories';
import { Brands, Channels, Users } from '../db/models';

/*
 * Generated test data
 */
const args = {
  username: faker.internet.userName(),
  email: faker.internet.email(),
  details: {
    avatar: faker.image.avatar(),
    fullName: faker.name.findName(),
    position: faker.name.jobTitle(),
    location: faker.address.streetName(),
    description: faker.random.word(),
  },
  links: {
    linkedIn: faker.internet.userName(),
    twitter: faker.internet.userName(),
    facebook: faker.internet.userName(),
    github: faker.internet.userName(),
    youtube: faker.internet.userName(),
    website: faker.internet.url(),
  },
  password: 'pass',
};

const toJSON = value => {
  return JSON.stringify(value, Object.keys(value).sort());
};

describe('User mutations', () => {
  let _user;
  let _admin;
  let _channel;
  let _brand;

  let context;

  const commonParamDefs = `
    $username: String!
    $email: String!
    $role: String!
    $details: UserDetails
    $links: UserLinks
    $channelIds: [String]
  `;

  const commonParams = `
    username: $username
    email: $email
    role: $role
    details: $details
    links: $links
    channelIds: $channelIds
  `;

  beforeEach(async () => {
    // Creating test data
    _user = await userFactory({});
    _admin = await userFactory({ role: 'admin' });
    _channel = await channelFactory({});
    _brand = await brandFactory({});

    context = { user: _user };
  });

  afterEach(async () => {
    // Clearing test data
    await Users.deleteMany({});
    await Brands.deleteMany({});
    await Channels.deleteMany({});
  });

  test('Login', async () => {
    process.env.HTTPS = 'false';

    const mutation = `
      mutation login($email: String! $password: String!) {
        login(email: $email password: $password)
      }
    `;

    const response = await graphqlRequest(mutation, 'login', {
      email: _user.email,
      password: 'pass',
    });

    expect(response).toBe('loggedIn');
  });

  test('Forgot password', async () => {
    process.env.MAIN_APP_DOMAIN = ' ';
    process.env.COMPANY_EMAIL_FROM = ' ';

    const mutation = `
      mutation forgotPassword($email: String!) {
        forgotPassword(email: $email)
      }
    `;

    await graphqlRequest(mutation, 'forgotPassword', { email: _user.email });

    const user = await Users.findOne({ email: _user.email });

    if (!user) {
      throw new Error('User not found');
    }

    expect(user.resetPasswordToken).toBeDefined();
  });

  test('Reset password', async () => {
    // create the random token
    const token = 'token';
    const user = await userFactory({});

    await Users.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: token,
          resetPasswordExpires: Date.now() + 86400000,
        },
      },
    );

    const mutation = `
      mutation resetPassword($token: String! $newPassword: String!) {
        resetPassword(token: $token newPassword: $newPassword)
      }
    `;

    const params = {
      token,
      newPassword: 'newPassword',
    };

    await graphqlRequest(mutation, 'resetPassword', params);

    const updatedUser = await Users.findOne({ _id: user._id });

    if (!updatedUser) {
      throw new Error('User not found');
    }

    expect(bcrypt.compare(params.newPassword, updatedUser.password)).toBeTruthy();
  });

  test('usersInvite', async () => {
    process.env.MAIN_APP_DOMAIN = ' ';
    process.env.COMPANY_EMAIL_FROM = ' ';

    const spyEmail = jest.spyOn(utils, 'sendEmail');

    const mutation = `
      mutation usersInvite($emails: [String]) {
        usersInvite(emails: $emails)
      }
  `;

    const params = {
      emails: ['test@example.com'],
    };

    await graphqlRequest(mutation, 'usersInvite', params, { user: _admin });

    const user = await Users.findOne({ email: 'test@example.com' });

    if (!user) {
      throw new Error('User not found');
    }

    const token = user.registrationToken || '';

    const { MAIN_APP_DOMAIN } = process.env;
    const invitationUrl = `${MAIN_APP_DOMAIN}/confirmation?token=${token}`;

    // send email call
    expect(spyEmail).toBeCalledWith({
      toEmails: ['test@example.com'],
      title: 'Team member invitation',
      template: {
        name: 'userInvitation',
        data: {
          content: invitationUrl,
          domain: MAIN_APP_DOMAIN,
        },
        isCustom: true,
      },
    });
  });

  test('usersSeenOnBoard', async () => {
    const mutation = `
      mutation usersSeenOnBoard {
        usersSeenOnBoard {
          _id
        }
      }
  `;

    await graphqlRequest(mutation, 'usersSeenOnBoard', {}, context);
    const userObj = await Users.findOne({ _id: _user._id });

    if (!userObj) {
      throw new Error('User not found');
    }

    // send email call
    expect(userObj.hasSeenOnBoard).toBeTruthy();
  });

  test('usersConfirmInvitation', async () => {
    await userFactory({
      email: 'test@example.com',
      registrationToken: '123',
      registrationTokenExpires: moment(Date.now())
        .add(7, 'days')
        .toDate(),
    });

    const mutation = `
      mutation usersConfirmInvitation($token: String, $password: String, $passwordConfirmation: String) {
        usersConfirmInvitation(token: $token, password: $password, passwordConfirmation: $passwordConfirmation) {
          _id
        }
      }
  `;

    const params = {
      token: '123',
      password: '123',
      passwordConfirmation: '123',
    };

    await graphqlRequest(mutation, 'usersConfirmInvitation', params);

    const userObj = await Users.findOne({ email: 'test@example.com' });

    if (!userObj) {
      throw new Error('User not found');
    }

    // send email call
    expect(userObj).toBeDefined();
  });

  test('Edit user', async () => {
    const doc = {
      ...args,
      role: 'contributor',
      passwordConfirmation: 'pass',
      channelIds: [_channel._id],
    };

    const mutation = `
      mutation usersEdit($_id: String! ${commonParamDefs}) {
        usersEdit(_id: $_id ${commonParams}) {
          _id
          username
          email
          role
          details {
            fullName
            avatar
            location
            position
            description
          }
          links {
            linkedIn
            twitter
            facebook
            github
            youtube
            website
          }
        }
      }
    `;

    const user = await graphqlRequest(mutation, 'usersEdit', { _id: _user._id, ...doc }, { user: _admin });

    const channel = await Channels.findOne({ _id: _channel._id });

    if (!channel) {
      throw new Error('Channel not found');
    }

    expect(channel.memberIds).toContain(user._id);
    expect(user.username).toBe(doc.username);
    expect(user.email.toLowerCase()).toBe(doc.email.toLowerCase());
    expect(user.role).toBe(doc.role);
    expect(user.details.fullName).toBe(doc.details.fullName);
    expect(user.details.avatar).toBe(doc.details.avatar);
    expect(user.details.location).toBe(doc.details.location);
    expect(user.details.position).toBe(doc.details.position);
    expect(user.details.description).toBe(doc.details.description);
    expect(user.links.linkedIn).toBe(doc.links.linkedIn);
    expect(user.links.twitter).toBe(doc.links.twitter);
    expect(user.links.facebook).toBe(doc.links.facebook);
    expect(user.links.github).toBe(doc.links.github);
    expect(user.links.youtube).toBe(doc.links.youtube);
    expect(user.links.website).toBe(doc.links.website);
  });

  test('Edit user profile', async () => {
    const mutation = `
      mutation usersEditProfile(
        $username: String!
        $email: String!
        $details: UserDetails
        $links: UserLinks
        $password: String!
      ) {
        usersEditProfile(
          username: $username
          email: $email
          details: $details
          links: $links
          password: $password
        ) {
          username
          email
          details {
            fullName
            avatar
            location
            position
            description
          }
          links {
            linkedIn
            twitter
            facebook
            github
            youtube
            website
          }
        }
      }
    `;

    const user = await graphqlRequest(mutation, 'usersEditProfile', args, context);

    expect(user.username).toBe(args.username);
    expect(user.email.toLowerCase()).toBe(args.email.toLowerCase());
    expect(user.details.fullName).toBe(args.details.fullName);
    expect(user.details.avatar).toBe(args.details.avatar);
    expect(user.details.location).toBe(args.details.location);
    expect(user.details.position).toBe(args.details.position);
    expect(user.details.description).toBe(args.details.description);
    expect(user.links.linkedIn).toBe(args.links.linkedIn);
    expect(user.links.twitter).toBe(args.links.twitter);
    expect(user.links.facebook).toBe(args.links.facebook);
    expect(user.links.github).toBe(args.links.github);
    expect(user.links.youtube).toBe(args.links.youtube);
    expect(user.links.website).toBe(args.links.website);
  });

  test('Change user password', async () => {
    const previousPassword = _user.password;

    const mutation = `
      mutation usersChangePassword(
        $currentPassword: String!
        $newPassword: String!
      ) {
        usersChangePassword(
          currentPassword: $currentPassword
          newPassword: $newPassword
        ) {
          _id
        }
      }
    `;

    await graphqlRequest(
      mutation,
      'usersChangePassword',
      {
        currentPassword: 'pass',
        newPassword: 'pass1',
      },
      context,
    );

    const user = await Users.findOne({ _id: _user._id });

    if (!user) {
      throw new Error('User not found');
    }

    expect(user.password).not.toBe(previousPassword);
  });

  test('Remove user', async () => {
    const mutation = `
      mutation usersSetActiveStatus($_id: String!) {
        usersSetActiveStatus(_id: $_id) {
          _id
          isActive
        }
      }
    `;

    await Users.updateOne({ _id: _user._id }, { $unset: { registrationToken: 1, isOwner: false } });

    await graphqlRequest(mutation, 'usersSetActiveStatus', { _id: _user._id }, { user: _admin });

    const deactivedUser = await Users.findOne({ _id: _user._id });

    if (!deactivedUser) {
      throw new Error('User not found');
    }

    expect(deactivedUser.isActive).toBe(false);
  });

  test('Remove user with pending invitation status', async () => {
    const mutation = `
      mutation usersSetActiveStatus($_id: String!) {
        usersSetActiveStatus(_id: $_id) {
          _id
        }
      }
    `;

    await graphqlRequest(mutation, 'usersSetActiveStatus', { _id: _user._id }, { user: _admin });

    const removedUser = await Users.findOne({ _id: _user._id });

    expect(removedUser).toBeNull();
  });

  test('Config user email signature', async () => {
    const signatures = [
      {
        signature: faker.random.word(),
        brandId: _brand._id,
      },
    ];

    const mutation = `
      mutation usersConfigEmailSignatures($signatures: [EmailSignature]) {
        usersConfigEmailSignatures(signatures: $signatures) {
          emailSignatures
        }
      }
    `;

    const user = await graphqlRequest(mutation, 'usersConfigEmailSignatures', { signatures }, context);

    expect(toJSON(user.emailSignatures)).toEqual(toJSON(signatures));
  });

  test('Config user get notification by email', async () => {
    const mutation = `
      mutation usersConfigGetNotificationByEmail($isAllowed: Boolean) {
        usersConfigGetNotificationByEmail(isAllowed: $isAllowed) {
          getNotificationByEmail
        }
      }
    `;

    const user = await graphqlRequest(mutation, 'usersConfigGetNotificationByEmail', { isAllowed: true }, context);

    expect(user.getNotificationByEmail).toBeDefined();
  });
});
