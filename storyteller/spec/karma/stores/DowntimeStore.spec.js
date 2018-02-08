import _ from 'lodash';
import { assert } from 'chai';

import sinon from 'sinon';
import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import DowntimeStore, {__RewireAPI__ as DowntimeStoreAPI} from 'editor/stores/DowntimeStore';

describe('DowntimeStore', function() {

  var acks;
  var errorSpy;
  var dispatcher;
  var downtimeStore;

  var downtimes = [{
    message_start: '2001-01-01T00:00:00Z',
    message_end: '2099-01-01T00:00:00:Z',
    downtime_start: '2001-01-01T00:00:00Z',
    downtime_end: '2099-01-01T00:00:00Z'
  }, {
    message_start: '2002-02-02T00:00:00Z',
    message_end: '2099-02-02T00:00:00:Z',
    downtime_start: '2002-02-02T00:00:00Z',
    downtime_end: '2099-02-02T00:00:00Z'
  }, {
    message_start: '2003-03-03T00:00:00Z',
    message_end: '2099-03-03T00:00:00:Z',
    downtime_start: '2003-03-03T00:00:00Z',
    downtime_end: '2099-03-03T00:00:00Z'
  }];

  function dispatchAction(action, payload) {
    payload = _.extend({action: action}, payload);
    dispatcher.dispatch(payload);
  }

  beforeEach(function() {
    acks = [978307200]; // downtimes[0] is already acked

    errorSpy = sinon.spy(console, 'error');

    dispatcher = new Dispatcher();
    StoreAPI.__Rewire__('dispatcher', dispatcher);

    DowntimeStoreAPI.__Rewire__('cookies', {
      get: function() { return acks; },
      set: function(_name, value) { acks = value; }
    });
    DowntimeStoreAPI.__Rewire__('Environment', {
      DOWNTIMES: downtimes
    });

    downtimeStore = new DowntimeStore();
  });

  afterEach(function() {
    errorSpy.restore();

    StoreAPI.__ResetDependency__('dispatcher');
    DowntimeStoreAPI.__ResetDependency__('cookies');
    DowntimeStoreAPI.__ResetDependency__('Environment');
  });

  it('retrieves unacknowledged downtimes', function() {
    assert.deepEqual(downtimeStore.getUnacknowledgedDowntimes(), downtimes.slice(1, 3));
  });

  describe('DOWNTIME_ACKNOWLEDGE', function() {
    it('logs an error if a downtime is not provided', function() {
      dispatchAction(Actions.DOWNTIME_ACKNOWLEDGE);
      assert.isTrue(errorSpy.called);
    });

    it('records an ack if a downtime is provided', function() {
      assert.equal(downtimeStore.getUnacknowledgedDowntimes().length, 2);
      assert.equal(acks.length, 1);

      dispatchAction(Actions.DOWNTIME_ACKNOWLEDGE, {downtime: downtimes[1]});
      assert.isFalse(errorSpy.called);

      assert.equal(downtimeStore.getUnacknowledgedDowntimes().length, 1);
      assert.equal(acks.length, 2);
    });
  });
});
