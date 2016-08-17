import React from 'react';
import GoalTableHead from '../GoalTableHead';
import GoalTableBody from '../GoalTableBody';
import RowsPerPageSelector from '../RowsPerPageSelector';
import PageSelector from '../PageSelector';

import './GoalTable.scss';

export default class GoalTable extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <div>
        <table className="table table-borderless op-admin-table">
          <GoalTableHead />
          <GoalTableBody />
        </table>
        <div>
          <PageSelector />
          <RowsPerPageSelector />
        </div>
      </div>
    );
  }
}
