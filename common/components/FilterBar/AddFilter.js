import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Picklist from '../Picklist';
import SocrataIcon from '../SocrataIcon';
import { getIconForDataType } from 'common/icons';
import I18n from 'common/i18n';
import { ESCAPE, ENTER, SPACE, isOneOfKeys, isolateEventByKeys } from 'common/dom_helpers/keycodes';

export class AddFilter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isChoosingColumn: false,
      searchTerm: ''
    };

    _.bindAll(this, [
      'onChangeSearchTerm',
      'onClickColumn',
      'onKeyDownAddFilterButton',
      'toggleColumnPicklist',
      'renderColumnOption',
      'renderColumnContainer',
      'renderPicklist',
      'renderSearch'
    ]);
  }

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
  }

  componentWillUnmount() {
    document.body.removeEventListener('click', this.bodyClickHandler);
    document.body.removeEventListener('keyup', this.bodyEscapeHandler);
  }

  onChangeSearchTerm(event) {
    this.setState({ searchTerm: event.target.value });
  }

  onClickColumn(column) {
    this.props.onClickColumn(column);
    this.toggleColumnPicklist();
  }

  onKeyDownAddFilterButton(event) {
    isolateEventByKeys(event, [ENTER, SPACE]);

    if (isOneOfKeys(event, [ENTER, SPACE])) {
      this.toggleColumnPicklist(event);
    }
  }

  toggleColumnPicklist(event) {
    if (event) {
      event.preventDefault();
    }

    this.setState({ isChoosingColumn: !this.state.isChoosingColumn });
  }

  renderColumnOption(column) {
    return (option) => (
      <div className="filter-bar-column-option">
        <SocrataIcon name={getIconForDataType(column.dataTypeName)} />
        <span>{option.title}</span>
      </div>
    );
  }

  renderColumnContainer() {
    const { isChoosingColumn } = this.state;

    if (!isChoosingColumn) {
      return;
    }

    return (
      <div className="column-container">
        <div className="add-filter-picklist">
          {this.renderSearch()}
          <div className="add-filter-picklist-options">
            {this.renderPicklist()}
          </div>
        </div>
      </div>
    );
  }

  renderPicklist() {
    const { columns } = this.props;
    const { searchTerm } = this.state;

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
      onSelection: (option) => {
        const column = _.find(columns, ['fieldName', option.value]);
        this.onClickColumn(column);
      },
      onBlur: () => this.setState({ isChoosingColumn: false }),
      value: searchTerm
    };

    if (_.isEmpty(picklistOptions)) {
      return (
        <div className="alert warning">
          {I18n.t('shared.components.filter_bar.no_options_found')}
        </div>
      );
    } else {
      return (
        <div className="add-filter-picklist-suggested-options">
          <Picklist {...picklistProps} />
        </div>
      );
    }
  }

  renderSearch() {
    const { searchTerm } = this.state;

    return (
      <div className="add-filter-picklist-input-container">
        <SocrataIcon name="search" />
        <input
          className="add-filter-picklist-input"
          type="text"
          aria-label={I18n.t('shared.components.filter_bar.search')}
          value={searchTerm || ''}
          autoFocus
          onChange={this.onChangeSearchTerm} />
      </div>
    );
  }

  render() {
    const button = (
      <button
        className="btn btn-sm btn-alternate-2 btn-inverse btn-add-filter"
        ref={(el) => this.addFilterButton = el}
        onClick={this.toggleColumnPicklist}
        onKeyDown={this.onKeyDownAddFilterButton}>
        {I18n.t('shared.components.filter_bar.add_filter')}
      </button>
    );

    return (
      <div className="add-filter">
        {button}
        {this.renderColumnContainer()}
      </div>
    );
  }
}

AddFilter.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object),
  onClickColumn: PropTypes.func.isRequired
};

export default AddFilter;
