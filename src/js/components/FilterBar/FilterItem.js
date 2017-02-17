import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import CalendarDateFilter from './CalendarDateFilter';
import NumberFilter from './NumberFilter';
import TextFilter from './TextFilter';
import FilterConfig from './FilterConfig';
import { translate as t } from '../../common/I18n';
import { ENTER, ESCAPE, SPACE, isOneOfKeys } from '../../common/keycodes';

export const FilterItem = React.createClass({
  propTypes: {
    filter: PropTypes.shape({
      'function': PropTypes.string.isRequired,
      columnName: PropTypes.string.isRequired,
      arguments: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.arrayOf(PropTypes.object)
      ]),
      isHidden: PropTypes.boolean
    }).isRequired,
    column: PropTypes.shape({
      dataTypeName: PropTypes.oneOf(['calendar_date', 'number', 'text']),
      name: PropTypes.string.isRequired
    }).isRequired,
    isReadOnly: PropTypes.bool.isRequired,
    fetchSuggestions: PropTypes.func,
    onUpdate: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      isControlOpen: false,
      isConfigOpen: false,
      isLeftAligned: false
    };
  },

  componentDidMount() {
    this.bodyClickHandler = (event) => {
      // Avoid closing flannels if the click is inside any of these refs.
      const flannelElements = [
        this.filterControl,
        this.filterConfig,
        this.filterControlToggle,
        this.filterConfigToggle
      ];

      // Are there any flannelElements that contain event.target?
      const isInsideFlannels = _.chain(flannelElements).
        compact().
        map(ReactDOM.findDOMNode).
        invokeMap('contains', event.target).
        some().
        value();

      /*
        the third-party library used for DateRangePicker
        adds the calendar element on the page body but not within the CalendarDateFilter div element.
        As a result, clicking on the calendar is considered to be outside of the CalendarDateFilter div element and dismisses it.
      */
      const datePickerElement = document.querySelector('.react-datepicker__tether-element');
      const isInsideDatePicker = datePickerElement && datePickerElement.contains(event.target);

      // If none of the flannelElements contain event.target, close all the flannels.
      if (!isInsideFlannels && !isInsideDatePicker) {
        this.closeAll();
      }
    };

    this.bodyEscapeHandler = (event) => {
      const { isControlOpen, isConfigOpen } = this.state;

      if (event.keyCode === ESCAPE) {
        if (isControlOpen) {
          this.closeAll();
          this.filterControlToggle.focus();
        } else if (isConfigOpen) {
          this.closeAll();
          this.filterConfigToggle.focus();
        }
      }
    };

    document.body.addEventListener('click', this.bodyClickHandler);
    document.body.addEventListener('keyup', this.bodyEscapeHandler);
  },

  componentWillUnmount() {
    document.body.removeEventListener('click', this.bodyClickHandler);
    document.body.removeEventListener('keyup', this.bodyEscapeHandler);
  },

  onCancel() {
    this.toggleControl();
    this.filterControlToggle.focus();
  },

  onKeyDownControl(event) {
    if (isOneOfKeys(event, [ENTER, SPACE])) {
      event.stopPropagation();
      event.preventDefault();
      this.toggleControl();
    }
  },

  onKeyDownConfig(event) {
    if (isOneOfKeys(event, [ENTER, SPACE])) {
      event.stopPropagation();
      event.preventDefault();
      this.toggleConfig();
    }
  },

  onUpdate(newFilter) {
    this.props.onUpdate(newFilter);
    this.closeAll();
    this.filterControlToggle.focus();
  },

  onRemove(filter) {
    this.props.onRemove(filter);
    this.closeAll();
  },

  toggleControl() {
    this.setState({
      isControlOpen: !this.state.isControlOpen,
      isConfigOpen: false,
      isLeftAligned: this.filterControlToggle.getBoundingClientRect().right < window.innerWidth / 2
    });
  },

  toggleConfig() {
    this.setState({
      isControlOpen: false,
      isConfigOpen: !this.state.isConfigOpen,
      isLeftAligned: this.filterConfigToggle.getBoundingClientRect().right < window.innerWidth / 2
    });
  },

  closeAll() {
    this.setState({
      isControlOpen: false,
      isConfigOpen: false
    });
  },

  renderFilterControl() {
    const { filter, column, fetchSuggestions } = this.props;
    const { isControlOpen } = this.state;

    if (!isControlOpen) {
      return null;
    }

    const filterProps = {
      filter,
      column,
      fetchSuggestions,
      onCancel: this.onCancel,
      onUpdate: this.onUpdate,
      ref: _.partial(_.set, this, 'filterControl')
    };

    switch (column.dataTypeName) {
      case 'calendar_date': return <CalendarDateFilter {...filterProps} />;
      case 'number': return <NumberFilter {...filterProps} />;
      case 'text': return <TextFilter {...filterProps} />;
      default: return null;
    }
  },

  renderFilterConfig() {
    const { filter, onUpdate } = this.props;
    const { isConfigOpen } = this.state;

    if (!isConfigOpen) {
      return null;
    }

    const configProps = {
      filter,
      onRemove: this.onRemove,
      onUpdate,
      ref: _.partial(_.set, this, 'filterConfig')
    };

    return <FilterConfig {...configProps} />;
  },

  renderFilterConfigToggle() {
    const { isReadOnly } = this.props;
    const { isLeftAligned } = this.state;

    const alignment = isLeftAligned ? 'left' : 'right';

    if (isReadOnly) {
      return null;
    } else {
      return (
        <div
          className={`filter-config-toggle ${alignment}`}
          aria-label={t('filter_bar.configure_filter')}
          tabIndex="0"
          role="button"
          onClick={this.toggleConfig}
          onKeyDown={this.onKeyDownConfig}
          ref={(el) => this.filterConfigToggle = el}>
          <span className="socrata-icon-kebab" role="presentation" />
        </div>
      );
    }
  },

  render() {
    const { column } = this.props;
    const { isLeftAligned } = this.state;

    const alignment = isLeftAligned ? 'left' : 'right';

    return (
      <div className="filter-bar-filter">
        <div className="filter-control-container">
          <div
            className={`filter-control-toggle ${alignment}`}
            aria-label={`${t('filter_bar.filter')} ${column.name}`}
            tabIndex="0"
            role="button"
            onClick={this.toggleControl}
            onKeyDown={this.onKeyDownControl}
            ref={(el) => this.filterControlToggle = el}>
            {column.name}
            <span className="dropdown-caret" role="presentation" />
          </div>

          {this.renderFilterControl()}
        </div>

        <div className="filter-config-container">
          {this.renderFilterConfigToggle()}
          {this.renderFilterConfig()}
        </div>
      </div>
    );
  }
});

export default FilterItem;
