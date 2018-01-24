import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import DateRangePicker from 'common/components/DateRangePicker';
import I18nJS from 'common/i18n';

import * as actions from '../../actions';

class DateRangeFilter extends PureComponent {
  render() {
    const { date, changeDateRange } = this.props;

    const title = I18nJS.t('screens.admin.activity_feed.filters.data_range.tooltip');

    const pickerProps = {
      value: date,
      onChange: changeDateRange,
      datePickerOverrides: {
        popperPlacement: 'left-start',
        popperModifiers: {
          preventOverflow: {
            enabled: true,
            escapeWithReference: false,
            boundariesElement: 'viewport'
          }
        },
        title
      }
    };

    const labelText = I18nJS.t('screens.admin.activity_feed.filters.data_range.label');

    return (
      <div className="filter-section date-range">
        <label className="filter-label">{labelText}</label>
        <DateRangePicker {...pickerProps} />
      </div>
    );
  }
}

DateRangeFilter.propTypes = {
  changeDateRange: PropTypes.func.isRequired,
  date: PropTypes.shape({
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired
  })
};

const mapStateToProps = (state) => ({
  date: _.get(state, 'filters.date')
});

const mapDispatchToProps = (dispatch) => ({
  changeDateRange: date => dispatch(actions.filters.changeDateRange(date))
});

export default connect(mapStateToProps, mapDispatchToProps)(DateRangeFilter);
