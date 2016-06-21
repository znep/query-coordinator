import React from 'react';
import GoalTableHead from '../../components/GoalTableHead';
import GoalTableBody from '../../components/GoalTableBody';
import './GoalTable.scss';

class GoalTable extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <table className="table table-borderless op-admin-table">
      <GoalTableHead />
      <GoalTableBody />
    </table>;
  }
}

export default GoalTable;
