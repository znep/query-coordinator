import _ from 'lodash';
import Cookies from 'js-cookie';
import moment from 'moment-timezone';

import Store from './Store';
import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import { exceptionNotifier } from '../../services/ExceptionNotifier';

export const DOWNTIME_MOMENT_FORMAT_STRING = 'YYYY-MM-DD[t]HH:mmZ';

function downtimeToAck({ message_start }) {
  return moment(message_start, DOWNTIME_MOMENT_FORMAT_STRING).unix();
}

function isDowntimeOpen({ message_start, message_end }) {
  const messageStart = moment(message_start, DOWNTIME_MOMENT_FORMAT_STRING);
  const messageEnd = moment(message_end, DOWNTIME_MOMENT_FORMAT_STRING);
  return moment().isBetween(messageStart, messageEnd);
}

// Maintain interoperability with frontend cookie values, even though frontend
// uses a crazy old jQuery cookie plugin.
const cookies = Cookies.withConverter({
  read: (value, name) => {
    if (name === 'maintenance_ack') {
      return JSON.parse(unescape(value));
    }
  },
  write: (value, name) => {
    if (name === 'maintenance_ack') {
      return escape(value);
    }
  }
});

export const downtimeStore = new DowntimeStore();
export default function DowntimeStore() {
  _.extend(this, new Store());

  const self = this;

  this.register((payload) => {
    switch (payload.action) {
      case Actions.DOWNTIME_ACKNOWLEDGE:
        _acknowledge(payload.downtime);
        break;
    }
  });

  this.getUnacknowledgedDowntimes = () => {
    const knownDowntimes = Environment.DOWNTIMES;
    const acks = cookies.get('maintenance_ack') || [];

    return _.reject(knownDowntimes, (downtime) => {
      return _.includes(acks, downtimeToAck(downtime)) || !isDowntimeOpen(downtime);
    });
  };

  function _acknowledge(downtime) {
    if (!downtime) {
      exceptionNotifier.notify(new Error('Did not specify a downtime to acknowledge'));
      return false;
    }

    const acks = cookies.get('maintenance_ack') || [];

    cookies.set(
      'maintenance_ack',
      acks.concat(downtimeToAck(downtime))
    );

    self._emitChange();
  }
}
