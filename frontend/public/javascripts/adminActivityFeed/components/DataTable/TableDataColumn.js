import PropTypes from 'prop-types';
import React from 'react';

export default class TableDataColumn extends React.Component {
  render() {
    const { item, column } = this.props;
    const { mapper: contentMapper, template: contentTemplate } = column;

    const rawContent = contentMapper(item);
    const contentElement = contentTemplate ? contentTemplate(rawContent) : rawContent;

    return React.createElement('td', { 'data-column': column.id }, contentElement);
  }
}

TableDataColumn.propTypes = {
  item: PropTypes.any.isRequired,
  column: PropTypes.any.isRequired
};
