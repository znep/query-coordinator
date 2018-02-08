import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import $ from 'jquery';
import FilterEditor from './FilterEditor';
import FilterConfig from './FilterConfig';
import SocrataIcon from '../SocrataIcon';
import I18n from 'common/i18n';
import { ENTER, ESCAPE, SPACE, isOneOfKeys } from 'common/dom_helpers/keycodes_deprecated';
import { getFilterHumanText } from './filters';

export class FilterItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isControlOpen: false,
      isConfigOpen: false,
      isLeftAligned: false
    };

    _.bindAll(this, [
      'onKeyDownControl',
      'onKeyDownConfig',
      'onUpdate',
      'onRemove',
      'toggleControl',
      'toggleConfig',
      'closeAll',
      'renderFilterConfig',
      'renderFilterConfigToggle',
      'renderFilterControl',
      'renderFilterControlToggle'
    ]);
  }

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
  }

  componentWillUnmount() {
    document.body.removeEventListener('click', this.bodyClickHandler);
    document.body.removeEventListener('keyup', this.bodyEscapeHandler);
  }

  onKeyDownControl(event) {
    if (isOneOfKeys(event, [ENTER, SPACE])) {
      event.stopPropagation();
      event.preventDefault();
      this.toggleControl();
    }
  }

  onKeyDownConfig(event) {
    if (isOneOfKeys(event, [ENTER, SPACE])) {
      event.stopPropagation();
      event.preventDefault();
      this.toggleConfig();
    }
  }

  onUpdate(newFilter) {
    this.props.onUpdate(newFilter);
    this.closeAll();
    this.filterControlToggle.focus();
  }

  onRemove(filter) {
    this.props.onRemove(filter);
    this.closeAll();
  }

  toggleControl() {
    this.setState({
      isControlOpen: !this.state.isControlOpen,
      isConfigOpen: false,
      isLeftAligned: this.filterControlToggle.getBoundingClientRect().right < window.innerWidth / 2
    });
  }

  toggleConfig() {
    this.setState({
      isControlOpen: false,
      isConfigOpen: !this.state.isConfigOpen,
      isLeftAligned: this.filterConfigToggle.getBoundingClientRect().right < window.innerWidth / 2
    });
  }

  closeAll() {
    this.setState({
      isControlOpen: false,
      isConfigOpen: false
    });
  }

  renderFilterConfig() {
    const { filter, onUpdate } = this.props;
    const { isConfigOpen } = this.state;

    if (!isConfigOpen) {
      return null;
    }

    const configProps = {
      filter,
      onUpdate,
      ref: ref => this.filterConfig = ref
    };

    return <FilterConfig {...configProps} />;
  }

  renderFilterConfigToggle() {
    const { isReadOnly } = this.props;
    const { isLeftAligned, isConfigOpen } = this.state;

    if (isReadOnly) {
      return null;
    }

    const toggleProps = {
      className: classNames('filter-config-toggle btn-default', {
        left: isLeftAligned,
        right: !isLeftAligned,
        active: isConfigOpen
      }),
      'aria-label': I18n.t('shared.components.filter_bar.configure_filter'),
      tabIndex: '0',
      role: 'button',
      onClick: this.toggleConfig,
      onKeyDown: this.onKeyDownConfig,
      ref: ref => this.filterConfigToggle = ref
    };

    return (
      <div {...toggleProps}>
        <span className="kebab-icon">
          <SocrataIcon name="kebab" />
        </span>
      </div>
    );
  }

  renderFilterControl() {
    const { isControlOpen, isLeftAligned } = this.state;
    const {
      column,
      controlSize,
      filter,
      isReadOnly,
      isValidTextFilterColumnValue,
      spandex
    } = this.props;

    if (!isControlOpen) {
      return null;
    }

    const filterProps = {
      column,
      controlSize,
      filter,
      isReadOnly,
      isValidTextFilterColumnValue,
      spandex,
      onClear: this.props.onClear,
      onClickConfig: this.toggleConfig,
      onRemove: this.onRemove,
      onUpdate: this.onUpdate
    };

    const spanProps = {
      className: classNames({
        left: isLeftAligned,
        right: !isLeftAligned
      }),
      ref: (ref) => this.filterControl = ref
    };

    return (
      // Need the extra span - otherwise ref could be null depending
      // on internal implementation of FilterEditor
      <span {...spanProps}>
        <FilterEditor {...filterProps} />
      </span>
    );
  }

  renderFilterControlToggle() {
    const { filter, column } = this.props;
    const { isLeftAligned, isControlOpen } = this.state;

    const toggleProps = {
      className: classNames('filter-control-toggle btn-default', {
        left: isLeftAligned,
        right: !isLeftAligned,
        active: isControlOpen
      }),
      'aria-label': `${I18n.t('shared.components.filter_bar.filter')} ${column.name}`,
      tabIndex: '0',
      role: 'button',
      onClick: this.toggleControl,
      onKeyDown: this.onKeyDownControl,
      ref: ref => this.filterControlToggle = ref
    };

    return (
      <div {...toggleProps}>
        {getFilterHumanText(filter, column)}
        <span className="arrow-down-icon">
          <SocrataIcon name="arrow-down" />
        </span>
      </div>
    );
  }

  render() {
    const CONFIG = 'config';
    const CONTROL = 'control';

    const closeIfBlurred = (which) => {

      // NOTE: While this works well for keyboard nav,
      // it fails on clicks (even if the click happens
      // inside the component)
      // Leaving this code commented in for now, as this
      // change is a hotfix for a more serious bug introduced
      // in EN-19848
      // TODO EN-19856 to fix keyboard blur -> closes container
      // _.defer(() => {
      //   const focused = document.activeElement;
      //   let container;
      //   if (which === CONFIG) {
      //     container = this.configContainer;
      //   } else if (which === CONTROL) {
      //     container = this.controlContainer;
      //   }
      //   const hasFocus = $.contains(container, focused);
      //   if (!hasFocus) {
      //     this.closeAll();
      //   }
      // });
    };

    // NOTE: You can't use ref'd values right away.
    //       Using a string constant to ID the
    //       container. There is probably a better
    //       way to do this.
    return (
      <div className="filter-bar-filter">
        <label className="filter-control-label">{this.props.column.name}</label>
        <div
          className="filter-control-container"
          ref={(ref) => this.controlContainer = ref}
          onBlur={() => closeIfBlurred(CONTROL)}>
          {this.renderFilterControlToggle()}
          {this.renderFilterControl()}
        </div>
        <div
          className="filter-config-container"
          ref={(ref) => this.configContainer = ref}
          onBlur={() => closeIfBlurred(CONFIG)}>
          {this.renderFilterConfigToggle()}
          {this.renderFilterConfig()}
        </div>
      </div>
    );
  }
}

FilterItem.propTypes = {
  column: PropTypes.shape({
    dataTypeName: PropTypes.oneOf(['calendar_date', 'checkbox', 'money', 'number', 'text']),
    name: PropTypes.string.isRequired
  }).isRequired,
  controlSize: PropTypes.oneOf(['small', 'medium', 'large']),
  filter: PropTypes.shape({
    'function': PropTypes.string.isRequired,
    columnName: PropTypes.string.isRequired,
    arguments: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.arrayOf(PropTypes.object)
    ]),
    isHidden: PropTypes.bool
  }).isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  isValidTextFilterColumnValue: PropTypes.func,
  spandex: PropTypes.shape({
    available: PropTypes.bool,
    datasetUid: PropTypes.string.isRequired,
    domain: PropTypes.string.isRequired,
    provider: PropTypes.object // i.e. PropTypes.instanceOf(SpandexDataProvider)
  }),
  onClear: PropTypes.func,
  onRemove: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default FilterItem;
