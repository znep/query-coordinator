import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Dropdown from 'common/components/Dropdown';
import I18nJS from 'common/i18n';
import { EVENT_TYPES } from '../../constants';
import * as actions from '../../actions';

class EventFilter extends PureComponent {
  prepareOptions() {
    const getTranslation = (key) => I18nJS.t(`screens.admin.activity_feed.filters.events.options.${key}`);

    const defaultOption = {
      title: getTranslation('all'),
      value: null,
      defaultValue: true
    };

    const options = EVENT_TYPES.map((opt) => ({
      title: getTranslation(_.snakeCase(opt)),
      value: opt,
      defaultValue: false
    }));

    return [defaultOption].concat(options);
  }

  render() {
    const { eventFilter, changeEventFilter } = this.props;

    const labelText = I18nJS.t('screens.admin.activity_feed.filters.events.label');

    const dropDownProps = {
      onSelection: (option) => changeEventFilter(option.value),
      options: this.prepareOptions(),
      size: 'medium',
      value: eventFilter || null
    };

    return (
      <div className="filter-section event-filter">
        <label className="filter-label">{labelText}</label>
        <Dropdown {...dropDownProps} />
      </div>
    );
  }
}

EventFilter.propTypes = {
  eventFilter: PropTypes.string,
  changeEventFilter: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  eventFilter: state.filters.event
});

const mapDispatchToProps = (dispatch) => ({
  changeEventFilter: (value) => dispatch(actions.filters.changeEventFilter(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(EventFilter);
