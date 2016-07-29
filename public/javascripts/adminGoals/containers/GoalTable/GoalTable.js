import React from 'react';
import GoalTableHead from '../../components/GoalTableHead';
import GoalTableBody from '../../components/GoalTableBody';
import RowsPerPageSelector from '../../components/RowsPerPageSelector/RowsPerPageSelector';
import PageSelector from '../../components/PageSelector/PageSelector';
import './GoalTable.scss';

export default function GoalTable() {
  return (
    <div>
      <h1>Manage Measures and Goals</h1>
      <table className="table table-borderless table-condensed op-admin-table">
        <GoalTableHead />
        <GoalTableBody />
        <tfoot>
          <tr>
            <td>
              <PageSelector />
              <RowsPerPageSelector />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
