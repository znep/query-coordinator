import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TypedCell from './TypedCell';
import moment from 'moment';

const dateFormats = {
  date_time: 'MM/DD/YYYY hh:mm:ss A',
  date: 'MM/DD/YYYY',
  date_dmy_time: 'DD/MM/YYYY hh:mm:ss A',
  date_dmy: 'DD/MM/YYYY',
  date_ymd_time: 'YYYY/MM/DD hh:mm:ss A',
  date_ymd: 'YYYY/MM/DD',
  date_monthdy_time: 'MMMM D, YYYY hh:mm:ss A',
  date_monthdy: 'MMMM D, YYYY',
  date_shortmonthdy: 'MMM D, YYYY',
  date_monthdy_shorttime: 'MMMM D, YYYY hh:mm A',
  date_dmonthy: 'D MMMM YYYY',
  date_dmonthy_time: 'D MMMM YYYY hh:mm:ss A',
  date_shortmonthdy_shorttime: 'MMM D, YYYY hh:mm:ss A',
  date_ymonthd_time: 'YYYY MMMM D hh:mm:ss A',
  date_ymonthd: 'YYYY MMMM D',
  date_my: 'MM/YYYY',
  date_ym: 'YYYY/MM',
  date_shortmonthy: 'MMM YYYY',
  date_yshortmonth: 'YYYY MMM',
  date_monthy: 'MMMM YYYY',
  date_ymonth: 'YYYY MMMM',
  date_y: 'YYYY'
};

class DateCell extends Component {
  render() {
    let text = '';
    const format = dateFormats[this.props.format.view];
    if (format) {
      text = moment(this.props.value).format(format);
    } else {
      text = this.props.value;
    }

    return <TypedCell isDropping={this.props.isDropping} value={text} format={this.props.format} />;
  }
}

DateCell.propTypes = {
  isDropping: PropTypes.bool,
  value: PropTypes.string,
  format: PropTypes.object
};

export default DateCell;
