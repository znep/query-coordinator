import React from 'react';
import GoalTableHead from '../../components/GoalTableHead';
import GoalTableBody from '../../components/GoalTableBody';
import RowsPerPageSelector from '../../components/RowsPerPageSelector';
import PageSelector from '../../components/PageSelector';

import './GoalTable.scss';

export default function GoalTable() {
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
