import PropTypes from 'prop-types';
import React from 'react';
import { Dropdown } from 'common/components';

const SubI18n = I18n.format_column;

const datetimeFormats = [
  { value: null, title: 'Use default' },
  { value: 'date_time', title: '05/23/2017 01:45:31 PM' },
  { value: 'date', title: '05/23/2017' },
  { value: 'date_dmy_time', title: '23/05/2017 01:45:31 PM' },
  { value: 'date_dmy', title: '23/05/2017' },
  { value: 'date_ymd_time', title: '2017/05/23 01:45:31 PM' },
  { value: 'date_ymd', title: '2017/05/23' },
  { value: 'date_monthdy_shorttime', title: 'May 23, 2017 01:45 PM' },
  { value: 'date_monthdy', title: 'May 23, 2017' },
  { value: 'date_shortmonthdy', title: 'May 23, 2017' },
  { value: 'date_monthdy_time', title: 'May 23, 2017 01:45:31 PM' },
  { value: 'date_dmonthy', title: '23 May 2017' },
  { value: 'date_shortmonthdy_shorttime', title: 'May 23, 2017 01:45 PM' },
  { value: 'date_ymonthd', title: '2017 May 23' },
  { value: 'date_ymonthd_time', title: '2017 May 23 01:45:31 PM' },
  { value: 'date_my', title: '05/2017' },
  { value: 'date_ym', title: '2017/05' },
  { value: 'date_shortmonthy', title: 'May 2017' },
  { value: 'date_yshortmonth', title: '2017 May' },
  { value: 'date_monthy', title: 'May 2017' },
  { value: 'date_ymonth', title: '2017 May' },
  { value: 'date_y', title: '2017' }
];

function DatetimeFormat({ onChange, format }) {
  const dropdownProps = {
    onSelection: e => onChange({ view: e.value }),
    value: format.view || null,
    options: datetimeFormats
  };

  return (
    <div>
      <label>{SubI18n.display_format}</label>
      <Dropdown {...dropdownProps} />
    </div>
  );
}

DatetimeFormat.propTypes = {
  onChange: PropTypes.func.isRequired,
  format: PropTypes.object.isRequired
};

export default DatetimeFormat;
