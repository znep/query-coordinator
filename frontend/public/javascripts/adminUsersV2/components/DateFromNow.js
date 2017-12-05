import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

const DateFromNow = props => {
  const { timestamp, todayLabel, unknownLabel } = props;
  const createdAtMoment = moment(timestamp, 'X');
  let label = createdAtMoment.fromNow();

  if (createdAtMoment.isValid()) {
    if (createdAtMoment.isSame(moment(), 'day') && todayLabel) {
      label = todayLabel;
    }
  } else {
    label = unknownLabel;
  }

  const title = createdAtMoment.isValid() ? createdAtMoment.format('LLLL') : unknownLabel;
  return <span title={title}>{label}</span>;
};

DateFromNow.propTypes = {
  timestamp: PropTypes.number,
  todayLabel: PropTypes.string,
  unknownLabel: PropTypes.string
};

DateFromNow.defaultProps = {
  unknownLabel: ''
};

export default DateFromNow;
