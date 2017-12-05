import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import _ from 'lodash';

export class TableColumn extends Component {
  static propTypes = {
    children: PropTypes.func,
    data: PropTypes.any,
    dataClassName: PropTypes.string,
    dataIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    header: PropTypes.string.isRequired,
    headerClassName: PropTypes.string
  };

  static defaultProps = {
    children: _.identity,
    data: null,
    dataClassName: '',
    headerClassName: ''
  };

  render() {
    const { children, data, dataIndex } = this.props;
    const renderedChildren = children(data[dataIndex], this.props.data);
    if (typeof renderedChildren === 'string' || _.isNumber(renderedChildren)) {
      return <span>{renderedChildren}</span>;
    } else {
      return renderedChildren && React.Children.only(renderedChildren);
    }
  }
}

const childrenOfType = (displayName, onError) => PropTypes.
  arrayOf((propValue, key, componentName, location, propFullName) => {
    const type = propValue[key].type;
    if (type.displayName !== displayName) {
      return new Error(onError(componentName, propFullName, type.displayName));
    }
  });

class ResultsTable extends Component {
  static propTypes = {
    children: childrenOfType(
      'TableColumn',
      (componentName, propFullName, displayName) =>
        `Non-TableColumn prop '${propFullName}' supplied to '${componentName}'. Received ${displayName}.`
      ),
    className: PropTypes.string,
    data: PropTypes.array.isRequired,
    loadingData: PropTypes.bool,
    noResultsMessage: PropTypes.string.isRequired,
    rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  };

  static defaultProps = {
    loadingData: false
  };

  renderHeaderRow = () => {
    const headerCells = React.Children.map(this.props.children, column => {
      const { header, headerClassName, ...otherProps } = column.props;
      const props = _.omit(otherProps, _.keys(TableColumn.propTypes));
      return (
        <th {...props} className={headerClassName}>
          {header}
        </th>
      );
    });
    return (
      <thead className="results-list-header">
        <tr>{headerCells}</tr>
      </thead>
    );
  };

  renderDataRows = () => {
    const { children, data, rowKey } = this.props;
    const rows = data.map((rowData, index) => {
      const cells = React.Children.map(children, child => {
        const { dataClassName, dataIndex } = child.props;
        const element = React.cloneElement(child, { data: rowData });
        return (
          <td className={dataClassName} key={dataIndex}>
            {element}
          </td>
        );
      });
      const key = (rowKey && rowKey.length) ? rowData[rowKey] : index;
      return <tr key={key}>{cells}</tr>;
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
    const props = _.omit(this.props, _.keys(ResultsTable.propTypes));
    const className = cx(
      'result-list-table table table-discrete table-condensed table-borderless',
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
