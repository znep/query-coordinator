import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import NumberFilter from './NumberFilter';
import TextFilter from './TextFilter';
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
    onUpdate: PropTypes.func
  },

  getDefaultProps() {
    return {
      onUpdate: _.noop
    };
  },

  getInitialState() {
    return {
      isOpened: false
    };
  },

  componentDidMount() {
    this.bodyClickHandler = document.body.addEventListener('click', (event) => {
      const { isOpened } = this.state;

      const filterControl = ReactDOM.findDOMNode(this.filterComponent);
      const toggleText = ReactDOM.findDOMNode(this.toggleText);

      const isFilterControl = isOpened && filterControl.contains(event.target);
      const isToggleText = toggleText.contains(event.target);

      if (isOpened && !isFilterControl && !isToggleText) {
        this.toggleOpened();
      }
    });

    this.bodyEscapeHandler = document.body.addEventListener('keyup', (event) => {
      if (this.state.isOpened && event.keyCode === ESCAPE) {
        this.toggleOpened();
        this.toggleText.focus();
      }
    });
  },

  componentWillUnmount() {
    document.body.removeEventListener('click', this.bodyClickHandler);
    document.body.removeEventListener('keyup', this.bodyEscapeHandler);
  },

  onCancel() {
    this.toggleOpened();
  },

  onUpdate(newFilter) {
    this.props.onUpdate(newFilter);
    this.toggleOpened();
  },

  toggleOpened() {
    this.setState({
      isOpened: !this.state.isOpened
    });
  },

  renderFilterControl() {
    const { filter, column, fetchSuggestions } = this.props;
    const { isOpened } = this.state;

    if (!isOpened) {
      return null;
    }

    const filterProps = {
      filter,
      column,
      fetchSuggestions,
      onCancel: this.onCancel,
      onUpdate: this.onUpdate,
      ref: _.partial(_.set, this, 'filterComponent')
    };

    switch (column.dataTypeName) {
      case 'number': return <NumberFilter {...filterProps} />;
      case 'text': return <TextFilter {...filterProps} />;
      default: return null;
    }
  },

  render() {
    const { filter, column } = this.props;

    return (
      <div className="filter-bar-filter">
        <div className="filter-title">{column.name}</div>
        <div className="filter-control-container">
          <div
            className="filter-control-toggle"
            aria-label={`${t('filter_bar.filter')} ${column.name}`}
            tabIndex="0"
            onClick={this.toggleOpened}
            onKeyPress={this.toggleOpened}
            ref={(el) => this.toggleText = el}>
            {getToggleTextForFilter(filter, column)}
            <span className="icon-chevron-down" role="presentation" />
          </div>

          {this.renderFilterControl()}
        </div>
      </div>
    );
  }
});

export default FilterItem;
