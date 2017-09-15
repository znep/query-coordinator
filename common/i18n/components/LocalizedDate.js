import _ from 'lodash';
import moment from 'moment-timezone';
import * as formats from '../config/momentjs-formats';
import PropTypes from 'prop-types';
import React from 'react';

export default function LocalizedDate(props, context) {
  const { I18n } = context;
  const { date, withTime, includeSeconds } = props;

  const locale = _.get(I18n, 'locale', I18n.defaultLocale);

  const format = withTime ?
    (
      includeSeconds ?
        _.get(formats, 'withTimeIncludingSeconds[locale]', formats.withTimeIncludingSeconds['en']) :
        'LLL'
    ) :
    'LL';

  const formattedDate = moment(date, moment.ISO_8601).locale(locale).format(format);

  const spanProps = _.omit(props, ['date', 'withTime', 'includeSeconds']);

  return <span {...spanProps}>{formattedDate}</span>;
}

LocalizedDate.propTypes = {
  date: PropTypes.any.isRequired,
  withTime: PropTypes.bool,
  includeSeconds: PropTypes.bool
};

LocalizedDate.contextTypes = {
  I18n: PropTypes.object,
  localization: PropTypes.object
};
