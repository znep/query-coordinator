import _ from 'lodash';
import moment from 'moment';
import React from 'react';

export default function LocalizedDate(props, context) {
  const { localization } = context;
  const { date } = props;

  const locale = localization.getLocale();

  const dateFormat = (locale === 'en') ? 'MMMM D, YYYY' : 'LL';
  const formattedDate = moment(date, moment.ISO_8601).locale(locale).format(dateFormat);

  const spanProps = _.omit(props, ['date']);

  return <span {...spanProps}>{formattedDate}</span>;
}

LocalizedDate.propTypes = {
  date: React.PropTypes.any.isRequired
};

LocalizedDate.contextTypes = {
  localization: React.PropTypes.object
};
