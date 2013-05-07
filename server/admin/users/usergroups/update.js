'use strict';


var _ = require('lodash');

var detectCircular = require('./_lib/detect_circular');
var updateSettings = require('./_lib/update_settings');
var PARAMS_SCHEMA  = require('./_lib/params_schema');


module.exports = function (N, apiPath) {
  var UserGroup = N.models.users.UserGroup;


  N.validate(apiPath, _.extend({
    _id: {
      type: 'string'
    , required: true
    , minLength: 24
    , maxLength: 24
    , pattern: /^[0-9a-f]{24}$/
    }
  }, PARAMS_SCHEMA));


  N.wire.on(apiPath, function (env, callback) {
    UserGroup.findById(env.params._id).exec(function (err, group) {
      if (err) {
        callback(err);
        return;
      }

      if (!group) {
        callback(N.io.NOT_FOUND);
        return;
      }

      detectCircular(group._id, env.params.parent_group, function (err, circularGroup) {
        if (err) {
          callback(err);
          return;
        }

        if (circularGroup) {
          callback({
            code: N.io.BAD_REQUEST
          , message: env.helpers.t('admin.users.usergroups.update.error.circular_dependency')
          });
          return;
        }

        if (!_.has(group.raw_settings, 'usergroup')) {
          group.raw_settings.usergroup = {};
        }

        group.short_name             = env.params.short_name;
        group.parent_group           = env.params.parent_group;

        // Raw settings is an "own" settings collection provided by the group.
        // - Root groups have all their settings as raw settings.
        // - Settings marked as "overriden" by the user become raw settings.
        //
        // See ./_lib/params_schema.js for details on raw settings format.
        group.raw_settings.usergroup = env.params.raw_settings;

        group.markModified('raw_settings.usergroup');

        group.save(function (err) {
          if (err) {
            callback(err);
            return;
          }

          updateSettings(N, callback);
        });
      });
    });
  });
};
