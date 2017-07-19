import _ from 'lodash';
import moment from 'moment-timezone';
import React from 'react';

export default function LocalizedDate(props, context) {
  const { I18n } = context;
  const { date, withTime } = props;

  const locale = _.get(I18n, 'locale', I18n.defaultLocale);

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
  I18n: React.PropTypes.object,
  localization: React.PropTypes.object
};
