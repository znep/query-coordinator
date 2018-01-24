import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import Head from './Head';
import Body from './Body';

class Table extends PureComponent {

  render() {
    const { apiCallInProgress } = this.props;

    const spinner = apiCallInProgress ? (
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
  apiCallInProgress: PropTypes.bool
};

Table.defaultProps = {
  apiCallInProgress: false
};

const mapStateToProps = state => ({
  apiCallInProgress: state.common.apiCallInProgress
});

export default connect(mapStateToProps)(Table);
