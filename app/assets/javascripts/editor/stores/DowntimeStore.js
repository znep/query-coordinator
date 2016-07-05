import _ from 'lodash';
import Cookies from 'js-cookie';
import moment from 'moment';

import Store from '../stores/Store';
import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import { exceptionNotifier } from '../../services/ExceptionNotifier';

function downtimeToAck(downtime) {
  return moment(downtime.message_start).unix();
}

function isDowntimeOpen(downtime) {
  return moment().isBetween(downtime.message_start, downtime.message_end);
}

// Maintain interoperability with frontend cookie values, even though frontend
// uses a crazy old jQuery cookie plugin.
var cookies = Cookies.withConverter({
  read: function(value, name) {
    if (name === 'maintenance_ack') {
      return JSON.parse(unescape(value));
    }
  },
  write: function(value, name) {
    if (name === 'maintenance_ack') {
      return escape(value);
    }
  }
});

export var downtimeStore = new DowntimeStore();
export default function DowntimeStore() {
  _.extend(this, new Store());

  var self = this;

  this.register(function(payload) {
    switch (payload.action) {
      case Actions.DOWNTIME_ACKNOWLEDGE:
        _acknowledge(payload.downtime);
        break;
    }
  });

  this.getUnacknowledgedDowntimes = function() {
    var knownDowntimes = Environment.DOWNTIMES;
    var acks = cookies.get('maintenance_ack') || [];

    return _.reject(knownDowntimes, function(downtime) {
      return _.includes(acks, downtimeToAck(downtime)) || !isDowntimeOpen(downtime);
    });
  };

  function _acknowledge(downtime) {
    if (!downtime) {
      exceptionNotifier.notify(new Error('Did not specify a downtime to acknowledge'));
      return false;
    }

    var acks = cookies.get('maintenance_ack') || [];

    cookies.set(
      'maintenance_ack',
      acks.concat(downtimeToAck(downtime))
    );

    self._emitChange();
  }
}
