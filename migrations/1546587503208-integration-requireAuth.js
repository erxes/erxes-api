const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Integrations = require("../dist/db/models/Integrations").default;

dotenv.config();

/**
 * Updating messenger integration's require auth to true
 *
 */
module.exports.up = function(next) {
  const { MONGO_URL } = process.env;

  mongoose.connect(
    MONGO_URL,
    { useNewUrlParser: true, useCreateIndex: true },
    function() {
      Integrations.updateMany(
        { kind: "messenger" },
        { $set: { "messengerData.requireAuth": true } }
      ).then(function() {
        next();
      });
    }
  );
};
