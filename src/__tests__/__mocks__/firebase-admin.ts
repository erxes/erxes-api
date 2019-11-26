const admin: any = jest.genMockFromModule('firebase-admin');

admin.__setApps = apps => {
  admin.apps = apps;
};

admin.apps = [];
admin.messaging = () => ({
  send: () => 'ok',
});

module.exports = admin;
