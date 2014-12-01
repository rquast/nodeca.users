// Fetch media list


'use strict';

var MEDIAS_PER_PAGE = 40;


module.exports = function (N, apiPath) {

  N.validate(apiPath, {
    user_hid: { type: 'integer', minimum: 1, required: true },
    album_id: { format: 'mongo' },
    last_media_id: { format: 'mongo' }
  });


  // Fetch owner
  //
  N.wire.before(apiPath, function fetch_user_by_hid(env, callback) {
    N.wire.emit('internal:users.fetch_user_by_hid', env, callback);
  });


  // Find and processes user media
  //
  N.wire.on(apiPath, function get_user_medias(env, callback) {
    var mTypes = N.models.users.MediaInfo.types;

    var query = N.models.users.MediaInfo
                  .find({ user_id: env.data.user._id, type: { $in: mTypes.LIST_VISIBLE } })
                  .lean(true)
                  .sort('-ts')
                  // Select one extra item to check next page exists
                  .limit(MEDIAS_PER_PAGE + 1);

    // If album_id not set, will fetch all user medias
    if (env.params.album_id) {
      query.where({ album_id: env.params.album_id });
    }

    // Get photos from `last_media_id`
    if (env.params.last_media_id) {
      query.where({ media_id: { $lt: env.params.last_media_id } });
    }

    query.exec(function (err, result) {
      if (err) {
        callback(err);
        return;
      }

      if (result.length === MEDIAS_PER_PAGE + 1) {
        // Remove extra item from response
        result.pop();

        env.res.has_next_page = true;
      } else {
        env.res.has_next_page = false;
      }

      env.res.user_hid = env.data.user.hid;
      env.res.medias = result;

      callback();
    });
  });
};
