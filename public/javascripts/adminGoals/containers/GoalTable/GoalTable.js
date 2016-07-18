import React from 'react';
import { connect } from 'react-redux';
import Alert from '../../components/Alert';
import GoalTableHead from '../../components/GoalTableHead';
import GoalTableBody from '../../components/GoalTableBody';
import RowsPerPageSelector from '../../components/RowsPerPageSelector';
import PageSelector from '../../components/PageSelector';
import './GoalTable.scss';

class GoalTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      alert: {}
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      alert: nextProps.alert.toJS()
    });
  }

  render() {
    return <div>
      <Alert { ...this.state.alert }/>
      <table className="table table-borderless op-admin-table">
        <GoalTableHead />
        <GoalTableBody />
      </table>
      <div>
        <PageSelector />
        <RowsPerPageSelector />
      </div>
    </div>;
  }
}

export default GoalTable;

const mapStateToProps = state => ({
  alert: state.getIn(['goalTableData', 'goalTableAlert'])
});

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GoalTable);
