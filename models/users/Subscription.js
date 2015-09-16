'use strict';


var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;


module.exports = function (N, collectionName) {

  var types = {
    UNSUBSCRIBED: 1,
    TRECKING: 2
    // TODO: add all types
  };


  var Subscription = new Schema({

    // Subscriber
    user_id: Schema.ObjectId,

    // Content id
    to: Schema.ObjectId,

    // Subscription type
    type: Number
  }, {
    versionKey: false
  });


  /////////////////////////////////////////////////////////////////////////////
  // Indexes

  // Used to check user subscription to:
  //
  // - forum topic
  // - forum section
  //
  Subscription.index({ user_id: 1, to: 1 });

  /////////////////////////////////////////////////////////////////////////////


  // Export types
  //
  Subscription.statics.types = types;


  N.wire.on('init:models', function emit_init_Subscription(__, callback) {
    N.wire.emit('init:models.' + collectionName, Subscription, callback);
  });


  N.wire.on('init:models.' + collectionName, function init_model_Subscription(schema) {
    N.models[collectionName] = Mongoose.model(collectionName, schema);
  });
};