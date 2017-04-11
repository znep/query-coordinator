import React from 'react';
import classNames from 'classnames';

export default class TableHeaderColumn extends React.Component {
  constructor(props) {
    super(props);

    this.handleColumnClick = this.handleColumnClick.bind(this);
  }

  handleColumnClick() {
    this.props.onSort(this.column);
  }

  render() {
    const { column, sorting } = this.props;
    const { title, sortable } = column;

    const isSorted = sortable && sorting !== 'none';

    const classes = classNames({
      'sorted':      isSorted,
      'sorted-asc':  isSorted && sorting === 'asc',
      'sorted-desc': isSorted && sorting === 'desc'
    });

    return (
      <th onClick={this.handleColumnClick} className={classes}>
        { title }
      </th>
    );
  }
}

TableHeaderColumn.propTypes = {
  sorting: React.PropTypes.oneOf(['asc', 'desc', 'none']).isRequired,
  column: React.PropTypes.object.isRequired,
  onSort: React.PropTypes.func.isRequired
};
