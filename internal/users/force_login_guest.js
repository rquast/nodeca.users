// Redirect guests to login page with back url id (fetched from server method)
'use strict';


module.exports = function (N, apiPath) {

  var createRedirect = function (redirectId) {
    var loginParams = redirectId ? { 'redirect_id': redirectId } : {};
    return {
      code: N.io.REDIRECT,
      head: {
        'Location': N.runtime.router.linkTo('users.auth.login.show', loginParams)
      }
    };
  };

  N.wire.on(apiPath, function force_login_guest(env, callback) {
    if (env.user_info.is_member) {
      callback();
      return;
    }

    var backUrl = N.runtime.router.linkTo(env.method, env.params);
    if (!backUrl) {
      // Should never happens. Can't build url - just redirect to login page
      callback(createRedirect());
      return;
    }

    // There will be second redirect (from http to https), but we can't cut protocol
    // because in dev environment we have different ports for http and https

    var loginRedirect = new N.models.users.LoginRedirect();
    loginRedirect.url = backUrl;

    loginRedirect.save(function (err, loginRedirect) {
      if (err) {
        callback(err);
        return;
      }

      // Redirect to login page with id of url (of target page)
      callback(createRedirect(loginRedirect._id));
    });
  });
};