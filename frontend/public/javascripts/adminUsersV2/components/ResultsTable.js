import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { SocrataIcon } from 'common/components';
import isFunction from 'lodash/isFunction';
import omit from 'lodash/omit';
import { SORT_DIRECTION } from 'common/users-api';


/**
 * TableCell is a wrapper to allow for better visualizing the flow of props through the table, and to
 * reconcile a cell's data with the index into that data
 */
const TableCell = ({ children, dataClassName, data, dataIndex }) => (
  <td className={dataClassName || null}>
    {children(data[dataIndex], data)}
  </td>
);

TableCell.propTypes = {
  children: PropTypes.func,
  dataClassName: PropTypes.string,
  data: PropTypes.any
};

/**
 * TableRow is a wrapper to allow for better visualizing the flow of props through the table
 */
const TableRow = ({ children, rowClassName }) => {
  const className = cx(rowClassName, 'results-list-row');
  return (<tr className={className}>{children}</tr>);
};

TableRow.propTypes = {
  children: PropTypes.any
};


const TableHeaderCell = ({ header, headerClassName, isActive, sortDirection, onSort, ...otherProps }) => {
  const baseProps = omit(otherProps, Object.keys(TableColumn.propTypes));
  const isSorted = isFunction(onSort);
  const props = {
    onClick: isSorted ? onSort : null,
    ...baseProps
  };
  const className = cx({
    'active': isActive,
    'sorted': isSorted,
    'ascending': sortDirection === SORT_DIRECTION.ASC && isActive,
    'descending': sortDirection === SORT_DIRECTION.DESC && isActive
  }, headerClassName, 'results-list-header-cell');
  return (
    <th {...props} className={className} scope="col" tabIndex="0">
      <span className="column-name">{header}</span>
      {isSorted ? <SocrataIcon className="ascending-arrow" name="arrow-up2" /> : null}
      {isSorted ? <SocrataIcon className="descending-arrow" name="arrow-down2" /> : null}
    </th>
  );
};

TableHeaderCell.propTypes = {
  header: PropTypes.string.isRequired,
  headerClassName: PropTypes.string,
  isActive: PropTypes.bool,
  onSort: PropTypes.func,
  sortDirection: PropTypes.oneOf(Object.values(SORT_DIRECTION))
};

TableHeaderCell.defaultProps = {
  isActive: false,
  headerClassName: ''
};

const TableHeaderRow = ({ children }) => {
  return (
    <thead className="results-list-header">
    <tr>{children}</tr>
    </thead>
  );
};

TableHeaderRow.propTypes = {
  children: PropTypes.any
};

/**
 * TableColumn doesn't render anything, it's just a props bag for configuration of the columns/row cells
 */
class TableColumn extends Component {
  static propTypes = {
    children: PropTypes.func,
    data: PropTypes.any,
    dataClassName: PropTypes.string,
    dataIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    ...TableCell.propTypes
  };

  static defaultProps = {
    children: (arg) => arg,
    data: null,
    dataClassName: ''
  };
}

const childrenOfType = (displayName, onError) => PropTypes.
  arrayOf((propValue, key, componentName, location, propFullName) => {
    const type = propValue[key].type;
    if (type.displayName !== displayName) {
      return new Error(onError(componentName, propFullName, type.displayName));
    }
  });

class ResultsTable extends Component {
  static Column = TableColumn;
  static propTypes = {
    children: childrenOfType(
      'TableColumn',
      (componentName, propFullName, displayName) =>
        `Non-TableColumn prop '${propFullName}' supplied to '${componentName}'. Received ${displayName}.`
      ),
    className: PropTypes.string,
    data: PropTypes.array.isRequired,
    isSortedDescending: PropTypes.bool,
    loadingData: PropTypes.bool,
    noResultsMessage: PropTypes.string.isRequired,
    rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  };

  static defaultProps = {
    isSortedDescending: false,
    loadingData: false
  };

  renderHeaderRow = () => {
    const headerCells = React.Children.map(this.props.children, column => <TableHeaderCell {...column.props} />);
    return (<TableHeaderRow>{headerCells}</TableHeaderRow>);
  };

  renderDataRows = () => {
    const { children, data, rowKey } = this.props;
    const rows = data.map((rowData, index) => {
      const cells = React.Children.map(children, child => (
        <TableCell {...child.props} data={rowData}>{child.props.children}</TableCell>
      ));
      const key = (rowKey && rowKey.length) ? rowData[rowKey] : index;
      return (<TableRow key={key}>{cells}</TableRow>);
    });
    return <tbody>{rows}</tbody>;
  };

  renderDataLoading = colSpan => (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="no-results-message">
          <span className="spinner-default spinner-large" />
        </td>
      </tr>
    </tbody>
  );

  renderNoResults = colSpan => {
    const { noResultsMessage } = this.props;
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="no-results-message">
            {noResultsMessage}
          </td>
        </tr>
      </tbody>
    );
  };

  render() {
    const props = omit(this.props, Object.keys(ResultsTable.propTypes));
    const className = cx(
      'results-list-table table table-discrete table-condensed table-borderless',
      this.props.className
    );
    const count = React.Children.count(this.props.children);

    const tableBody = this.props.loadingData
      ? this.renderDataLoading(count)
      : this.props.data.length === 0 ? this.renderNoResults(count) : this.renderDataRows();

    return (
      <table {...props} className={className}>
        {this.renderHeaderRow()}
        {tableBody}
      </table>
    );
  }
}

export default ResultsTable;
