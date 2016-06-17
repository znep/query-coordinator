/* eslint-disable no-unused-vars */

import React, { PropTypes } from 'react';
import GoalTableHead from '../../components/GoalTableHead';
import GoalTableBody from '../../components/GoalTableBody';
import './DataTable.scss';

/* eslint-enable no-unused-vars */

class DataTable extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <table className="table table-borderless">
      <GoalTableHead />
      <GoalTableBody />
    </table>;
  }
}

DataTable.propTypes = {};

export default DataTable;
