import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import Head from './Head';
import Body from './Body';

class Table extends PureComponent {

  render() {
    const { fetchingTable } = this.props;

    const spinner = fetchingTable ? (
      <div className="catalog-results-spinner-container">
        <span className="spinner-default spinner-large"></span>
      </div>
    ) : null;

    const tableClass = classNames('result-list-table table table-discrete table-condensed table-borderless');

    return (
      <div className="table-wrapper">
        <table className={tableClass}>
          <Head />
          <Body />
        </table>
        {spinner}
      </div>
    );
  }
}

Table.propTypes = {
  fetchingTable: PropTypes.bool
};

Table.defaultProps = {
  fetchingTable: false
};

const mapStateToProps = state => ({
  fetchingTable: state.table.fetchingTable
});

export default connect(mapStateToProps)(Table);
