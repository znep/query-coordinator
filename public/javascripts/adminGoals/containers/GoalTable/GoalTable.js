import React from 'react';
import GoalTableHead from '../../components/GoalTableHead';
import GoalTableBody from '../../components/GoalTableBody';
import RowsPerPageSelector from '../../components/RowsPerPageSelector';
import './GoalTable.scss';

class GoalTable extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div>
      <table className="table table-borderless op-admin-table">
        <GoalTableHead />
        <GoalTableBody />
      </table>
      <div>
        <RowsPerPageSelector />
      </div>
    </div>;
  }
}

export default GoalTable;
