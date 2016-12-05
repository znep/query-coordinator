import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import SearchablePicklist from './SearchablePicklist';
import _ from 'lodash';
import { getIconForDataType } from '../../common/icons';
import { translate as t } from '../../common/I18n';
import { ESCAPE } from '../../common/keycodes';

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
    this.bodyClickHandler = document.body.addEventListener('click', (event) => {
      var el = ReactDOM.findDOMNode(this);
      if (this.state.isChoosingColumn && !el.contains(event.target)) {
        this.toggleColumnPicklist(event);
      }
    });

    this.bodyEscapeHandler = document.body.addEventListener('keyup', (event) => {
      if (this.state.isChoosingColumn && event.keyCode === ESCAPE) {
        this.toggleColumnPicklist();
        this.addFilterButton.focus();
      }
    });
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

  toggleColumnPicklist(event) {
    if (event) {
      event.preventDefault();
    }

    this.setState({ isChoosingColumn: !this.state.isChoosingColumn });
  },

  renderColumnContainer() {
    const { columns } = this.props;
    const { isChoosingColumn, searchTerm } = this.state;

    if (!isChoosingColumn) {
      return;
    }

    const picklistOptions = _.chain(columns).
      filter((column) => _.toLower(column.name).match(_.toLower(searchTerm))).
      map((column) => {
        return {
          value: column.fieldName,
          title: column.name,
          render: (option) => {
            return (
              <div className="filter-bar-column-option">
                <span className={getIconForDataType(column.dataTypeName)} role="presentation" />
                {option.title}
              </div>
            );
          }
        };
      }).
      value();

    const picklistProps = {
      options: picklistOptions,
      onChangeSearchTerm: this.onChangeSearchTerm,
      onSelection: (option) => {
        const column = _.find(columns, ['fieldName', option.value]);
        this.onClickColumn(column);
      },
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
      <div
        className="add-filter-button"
        ref={(el) => this.addFilterButton = el}
        onClick={this.toggleColumnPicklist}
        onKeyPress={this.toggleColumnPicklist}
        role="button"
        tabIndex="0">
        {t('filter_bar.add_filter')}
        <span className="socrata-icon-add" role="presentation" />
      </div>
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
