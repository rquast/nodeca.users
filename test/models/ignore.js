'use strict';


const _        = require('lodash');
const assert   = require('assert');
const Promise  = require('bluebird');
const ObjectId = require('mongoose').Types.ObjectId;


describe('Ignore', function () {
  it('should expire ignore entries', Promise.coroutine(function* () {
    let id1 = new ObjectId();
    let id2 = new ObjectId();
    let id3 = new ObjectId();
    let id4 = new ObjectId();
    let id5 = new ObjectId();

    yield (new TEST.N.models.users.Ignore({
      from: id1,
      to: id2
    })).save();

    yield (new TEST.N.models.users.Ignore({
      from: id1,
      to: id3,
      expire: new Date(Date.now() - 60000)
    })).save();

    yield (new TEST.N.models.users.Ignore({
      from: id1,
      to: id4,
      expire: new Date(Date.now() + 60000)
    })).save();

    yield (new TEST.N.models.users.Ignore({
      from: id1,
      to: id5,
      expire: new Date(Date.now() - 120000)
    })).save();

    // Run task
    yield TEST.N.queue.ignore_expire().run();
    yield Promise.delay(600);

    let ignored_users = yield TEST.N.models.users.Ignore.find({ from: id1 }).lean(true);

    assert.deepEqual(_.map(ignored_users, 'to'), [ id2, id4 ]);
  }));
});
