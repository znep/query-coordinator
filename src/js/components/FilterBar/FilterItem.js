import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import NumberFilter from './NumberFilter';
import TextFilter from './TextFilter';
import FilterConfig from './FilterConfig';
import { translate as t } from '../../common/I18n';
import { getToggleTextForFilter } from './filters';
import { ESCAPE } from '../../common/keycodes';

export const FilterItem = React.createClass({
  propTypes: {
    filter: PropTypes.shape({
      parameters: PropTypes.shape({
        'function': PropTypes.string.isRequired,
        columnName: PropTypes.string.isRequired,
        arguments: PropTypes.object.isRequired
      }),
      isLocked: PropTypes.boolean,
      isHidden: PropTypes.boolean,
      isRequired: PropTypes.boolean,
      allowMultiple: PropTypes.boolean
    }).isRequired,
    column: PropTypes.shape({
      dataTypeName: PropTypes.oneOf(['number', 'text']),
      name: PropTypes.string.isRequired
    }).isRequired,
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

      // If none of the flannelElements contain event.target, close all the flannels.
      if (!isInsideFlannels) {
        this.closeAll();
      }
    };

    this.bodyEscapeHandler = (event) => {
      if (event.keyCode === ESCAPE) {
        this.closeAll();
        this.toggleText.focus();
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
  },

  onUpdate(newFilter) {
    this.props.onUpdate(newFilter);
    this.closeAll();
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
      isConfigOpen: !this.state.isConfigOpen
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
      case 'number': return <NumberFilter {...filterProps} />;
      case 'text': return <TextFilter {...filterProps} />;
      default: return null;
    }
  },

  renderFilterConfig() {
    const { filter } = this.props;
    const { isConfigOpen } = this.state;

    if (!isConfigOpen) {
      return null;
    }

    const configProps = {
      filter,
      onRemove: this.onRemove,
      ref: _.partial(_.set, this, 'filterConfig')
    };

    return <FilterConfig {...configProps} />;
  },

  render() {
    const { filter, column } = this.props;
    const { isLeftAligned } = this.state;

    const alignment = isLeftAligned ? 'left' : 'right';

    return (
      <div className="filter-bar-filter">
        <div className="filter-title">{column.name}</div>

        <div className="filter-control-container">
          <div
            className={`filter-control-toggle ${alignment}`}
            aria-label={`${t('filter_bar.filter')} ${column.name}`}
            tabIndex="0"
            onClick={this.toggleControl}
            onKeyPress={this.toggleControl}
            ref={(el) => this.filterControlToggle = el}>
            {getToggleTextForFilter(filter, column)}
            <span className="socrata-icon-chevron-down" role="presentation" />
          </div>

          {this.renderFilterControl()}
        </div>

        <div className="filter-config-container">
          <div
            className={`filter-config-toggle ${alignment}`}
            aria-label={t('filter_bar.configure_filter')}
            tabIndex="0"
            onClick={this.toggleConfig}
            onKeyPress={this.toggleConfig}
            ref={(el) => this.filterConfigToggle = el}>
            <span className="socrata-icon-kebab" role="presentation" />
          </div>

          {this.renderFilterConfig()}
        </div>
      </div>
    );
  }
});

export default FilterItem;
