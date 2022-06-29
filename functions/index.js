/* eslint-disable operator-linebreak */
/* eslint-disable require-jsdoc */
const admin = require("firebase-admin");
const api = require("./api");

// Follow instructions to set up admin credentials:
// https://firebase.google.com/docs/functions/local-emulator#set_up_admin_credentials_optional
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: undefined,
});

admin.firestore().settings({ ignoreUndefinedProperties: true });

exports.api = api.api;
