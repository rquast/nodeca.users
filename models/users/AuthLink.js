// Store links beetween user and auth providers.
//
// Sub-document describes link info for specified provider
// Note: some fields such as `pass` and `ext_id`,
// could be optional for some providers

'use strict';


var Mongoose = require('mongoose');
var Schema   = Mongoose.Schema;
var password = require('./_lib/password');


module.exports = function (N, collectionName) {

  // Provider sub-document schema
  //
  var AuthProvider = new Schema({
    // Provider types. We plan to support:
    //
    // - `plain` - just email/password pair
    // - `yandex`, `facebook`, `vkontakte`, `twitter` - different oauth (not supported now)
    type   : String,

    // Provider state
    // FIXME: define states (active/validating)
    state  : Number,

    // Email is mandatory to `email` provider
    // We also will require it everywhere, when possible (twitter don't have it)
    email  : String,

    // Password/Salt hash - for email provider only
    // Salt is stored right in hash string
    pass   : String,

    // For oauth providers only, external user id
    ext_id : String,

    // metadata, if we like to extract extended info from oauth providers
    meta   : {}
  },
  {
    versionKey : false
  });

  // Indexes (subdocuments)
  //////////////////////////////////////////////////////////////////////////////

  // - login by email
  // - check that email is unique
  AuthProvider.index({ email: 1, provider: 1 });

  // used in login via oauth
  AuthProvider.index({ ext_id: 1, provider: 1 });


  //////////////////////////////////////////////////////////////////////////////

  /**
   * models.users.AuthLink#providers.AuthProvider#setPass(password) -> void
   * - password(String):  user password
   *
   * Generate password hash and put in property
   **/
  AuthProvider.methods.setPass = function (pass, callback) {
    if (this.type !== 'plain') {
      callback(new Error('Can\'t set password for non plain peovider'));
      return;
    }
    var self = this;
    password.hash(pass, function(err, hash) {
      self.pass = hash;
      callback();
    });
  };


  /**
   * models.users.AuthLink#providers.AuthProvider#checkPass(password) -> Boolean
   * - password(String):  checked word
   *
   * Compare word with stored password
   **/
  AuthProvider.methods.checkPass = function (pass, callback) {
    if (this.type !== 'plain') {
      callback(new Error('Can\'t set password for non plain peovider'));
      return;
    }
    password.check(pass, this.pass, callback);
  };

  //////////////////////////////////////////////////////////////////////////////

  /**
   *  new models.users.AuthLink()
   *
   *  Create new odm object
   **/
  var AuthLink = new Schema({
    user_id   : Schema.ObjectId
  , providers : [AuthProvider]
  },
  {
    versionKey : false
  });

  // Indexes
  //////////////////////////////////////////////////////////////////////////////

  // used in:
  // - login via nickname
  // - extract auth info in other cases
  AuthLink.index({
    user_id: 1
  });

  //////////////////////////////////////////////////////////////////////////////


  N.wire.on('init:models', function emit_init_AuthLink(__, callback) {
    N.wire.emit('init:models.' + collectionName, AuthLink, callback);
  });


  N.wire.on('init:models.' + collectionName, function init_model_AuthLink(schema) {
    N.models[collectionName] = Mongoose.model(collectionName, schema);
  });
};
