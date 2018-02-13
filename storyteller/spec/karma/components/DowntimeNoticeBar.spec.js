import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import I18nMocker from '../I18nMocker';
import Store from 'editor/stores/Store';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as DowntimeNoticeBarAPI} from 'editor/components/DowntimeNoticeBar';

describe('downtimeNoticeBar jQuery plugin', function() {

  var $downtimeNoticeBar;
  var downtimeStoreMock;
  var dispatcher;

  var downtimes = [{
    downtime_start: '2001-01-01T00:00:00Z',
    downtime_end: '2099-01-01T00:00:00Z'
  }, {
    downtime_start: '2002-02-02T00:00:00Z',
    downtime_end: '2099-02-02T00:00:00Z'
  }];

  beforeEach(function() {
    $(document.body).attr('class', '');
    $downtimeNoticeBar = $('<div>');

    function MockStore() {
      var self = this;
      var _downtimes = [];

      _.extend(this, new Store());

      this.register(function(payload) {
        switch (payload.action) {
          case Actions.DOWNTIME_ACKNOWLEDGE:
            // simulate effect of adding an ack cookie
            _downtimes.shift();
            self._emitChange();
            break;
        }
      });

      this.mockDowntimes = function(downtimesSubset) {
        _downtimes = downtimesSubset;
        self._emitChange();
      };

      this.getUnacknowledgedDowntimes = function() { return _downtimes; };
    }

    downtimeStoreMock = new MockStore();
    dispatcher = new Dispatcher();

    DowntimeNoticeBarAPI.__Rewire__('downtimeStore', downtimeStoreMock);
    DowntimeNoticeBarAPI.__Rewire__('I18n', I18nMocker);
    DowntimeNoticeBarAPI.__Rewire__('dispatcher', dispatcher);
  });

  afterEach(function() {
    DowntimeNoticeBarAPI.__ResetDependency__('downtimeStore');
    DowntimeNoticeBarAPI.__ResetDependency__('I18n');
    DowntimeNoticeBarAPI.__ResetDependency__('dispatcher');
  });

  it('should return a jQuery object for chaining', function() {
    var returnValue = $downtimeNoticeBar.downtimeNoticeBar();
    assert.instanceOf(returnValue, $);
  });

  describe('instance', function() {
    beforeEach(function() {
      $downtimeNoticeBar.downtimeNoticeBar();
    });

    describe('when there are no unacknowledged downtimes', function() {
      it('displays nothing', function() {
        assert.isNotOk($downtimeNoticeBar.find('.message').text());
      });
    });

    describe('when there is one unacknowledged downtime', function() {
      beforeEach(function() {
        downtimeStoreMock.mockDowntimes(downtimes.slice(0, 1));
        downtimeStoreMock._emitChange();
      });

      it('displays a message', function() {
        assert.include($downtimeNoticeBar.find('.message').text(), 'Translation for: editor.downtime');
      });

      it('emits a DOWNTIME_ACKNOWLEDGE action when closed', function(done) {
        dispatcher.register(function(action) {
          if (action.action === Actions.DOWNTIME_ACKNOWLEDGE) {
            done();
          }
        });

        $downtimeNoticeBar.find('a').click();
        assert.isNotOk($downtimeNoticeBar.find('.message').text());
      });
    });

    describe('where there are multiple downtimes', function() {
      beforeEach(function() {
        downtimeStoreMock.mockDowntimes(downtimes);
        downtimeStoreMock._emitChange();
      });

      it('continues to display messages as long as there is an unacknowledged downtime', function(done) {
        var reallyDone = _.after(2, done);

        dispatcher.register(function(action) {
          if (action.action === Actions.DOWNTIME_ACKNOWLEDGE) {
            reallyDone();
          }
        });

        assert.include($downtimeNoticeBar.find('.message').text(), 'Translation for: editor.downtime');
        $downtimeNoticeBar.find('a').click();
        assert.include($downtimeNoticeBar.find('.message').text(), 'Translation for: editor.downtime');
        $downtimeNoticeBar.find('a').click();
        assert.isNotOk($downtimeNoticeBar.find('.message').text());
      });
    });
  });

});
