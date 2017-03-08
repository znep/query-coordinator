import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import SearchablePicklist from './SearchablePicklist';
import _ from 'lodash';
import { getIconForDataType } from '../../common/icons';
import { translate as t } from '../../common/I18n';
import { ESCAPE, ENTER, SPACE, isOneOfKeys, isolateEventByKeys } from '../../common/keycodes';

export const AddFilter = React.createClass({
  propTypes: {
    columns: PropTypes.arrayOf(PropTypes.object),
    onClickColumn: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      isChoosingColumn: false,
      searchTerm: ''
    };
  },

  componentDidMount() {
    this.bodyClickHandler = (event) => {
      var el = ReactDOM.findDOMNode(this);
      if (this.state.isChoosingColumn && !el.contains(event.target)) {
        this.toggleColumnPicklist(event);
      }
    };

    this.bodyEscapeHandler = (event) => {
      if (this.state.isChoosingColumn && event.keyCode === ESCAPE) {
        this.toggleColumnPicklist();
        this.addFilterButton.focus();
      }
    };

    document.body.addEventListener('click', this.bodyClickHandler);
    document.body.addEventListener('keyup', this.bodyEscapeHandler);
  },

  componentWillUnmount() {
    document.body.removeEventListener('click', this.bodyClickHandler);
    document.body.removeEventListener('keyup', this.bodyEscapeHandler);
  },

  onChangeSearchTerm(searchTerm) {
    this.setState({ searchTerm });
  },

  onClickColumn(column) {
    this.props.onClickColumn(column);
    this.toggleColumnPicklist();
  },

  onKeyDownAddFilterButton(event) {
    isolateEventByKeys(event, [ENTER, SPACE]);

    if (isOneOfKeys(event, [ENTER, SPACE])) {
      this.toggleColumnPicklist(event);
    }
  },

  toggleColumnPicklist(event) {
    if (event) {
      event.preventDefault();
    }

    this.setState({ isChoosingColumn: !this.state.isChoosingColumn });
  },

  renderColumnOption(column) {
    return (option) => (
      <div className="filter-bar-column-option">
        <span className={getIconForDataType(column.dataTypeName)} role="presentation" />
        {option.title}
      </div>
    );
  },

  renderColumnContainer() {
    const { columns } = this.props;
    const { isChoosingColumn, searchTerm } = this.state;

    if (!isChoosingColumn) {
      return;
    }

    const picklistOptions = _.chain(columns).
      filter((column) => _.toLower(column.name).match(_.toLower(searchTerm))).
      map((column) => ({
        value: column.fieldName,
        title: column.name,
        render: this.renderColumnOption(column)
      })).
      value();

    const picklistProps = {
      options: picklistOptions,
      onChangeSearchTerm: this.onChangeSearchTerm,
      onSelection: (option) => {
        const column = _.find(columns, ['fieldName', option.value]);
        this.onClickColumn(column);
      },
      onBlur: () => this.setState({ isChoosingColumn: false }),
      value: searchTerm
    };

    return (
      <div className="column-container">
        <SearchablePicklist {...picklistProps} />
      </div>
    );
  },

  render() {
    const button = (
      <button
        className="btn btn-sm btn-alternate-2 btn-inverse btn-add-filter"
        ref={(el) => this.addFilterButton = el}
        onClick={this.toggleColumnPicklist}
        onKeyDown={this.onKeyDownAddFilterButton}>
        {t('filter_bar.add_filter')}
      </button>
    );

    return (
      <div className="add-filter">
        {button}
        {this.renderColumnContainer()}
      </div>
    );
  }
});

export default AddFilter;
