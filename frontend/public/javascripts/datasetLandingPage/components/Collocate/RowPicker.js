import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Picklist } from 'common/components';
import classNames from 'classnames';

export default class RowPicker extends Component {
  static propTypes = {
    // Title of dataset
    title: PropTypes.string,

    // The columns to show
    columns: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string,
      value: PropTypes.string,
      icon: PropTypes.object
    })),

    // Column selected
    onSelect: PropTypes.func,

    // Title click handler
    onTitleClick: PropTypes.func
  }

  render() {
    const {
      title,
      columns,
      onTitleClick,
      onSelect
    } = this.props;

    const body =
    (<div className={classNames('row-select', { 'target': onTitleClick != null })}>
      <span onClick={onTitleClick}><h3>{title}</h3></span>
      <Picklist
        onSelection={onSelect}
        options={columns} />
    </div>);

    return body;
  }
}

