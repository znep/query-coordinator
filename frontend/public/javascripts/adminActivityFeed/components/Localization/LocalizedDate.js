import _ from 'lodash';
import moment from 'moment-timezone';
import React from 'react';

export default function LocalizedDate(props, context) {
  const { localization } = context;
  const { date, withTime } = props;

  const locale = localization.getLocale();

  const format = withTime ? 'LLL' : 'LL';
  const formattedDate = moment(date, moment.ISO_8601).locale(locale).format(format);

  const spanProps = _.omit(props, ['date', 'withTime']);

  return <span {...spanProps}>{formattedDate}</span>;
}

LocalizedDate.propTypes = {
  date: React.PropTypes.any.isRequired,
  withTime: React.PropTypes.bool
};

LocalizedDate.contextTypes = {
  localization: React.PropTypes.object
};
