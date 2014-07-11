// Show after register intructions, i.e. 'activate your account'.

'use strict';


module.exports = function (N, apiPath) {
  N.validate(apiPath, {});

  N.wire.on(apiPath, function register_done(env) {
    env.res.head.title = env.t('title');
  });
};
