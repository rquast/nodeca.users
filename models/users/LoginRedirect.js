// Urls to redirect user after login

'use strict';


var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;


module.exports = function (N, collectionName) {

  var LoginRedirect = new Schema({
    'url'   : String
  }, {
    versionKey: false,
    // 1 MB, ~10000 records
    capped: 1048576
  });


  N.wire.on('init:models', function emit_init_LoginRedirect(__, callback) {
    N.wire.emit('init:models.' + collectionName, LoginRedirect, callback);
  });


  N.wire.on('init:models.' + collectionName, function init_model_LoginRedirect(schema) {
    N.models[collectionName] = Mongoose.model(collectionName, schema);
  });
};
