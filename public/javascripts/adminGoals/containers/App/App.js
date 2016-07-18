import React  from 'react';
import { connect } from 'react-redux';
import GoalTable from './../GoalTable/GoalTable';
import GoalQuickEdit from '../../components/GoalQuickEdit';
import EditMultipleItemsForm from '../EditMultipleItemsForm/EditMultipleItemsForm';
import SCBulkActions from '../SCBulkActions';
import './App.scss';

function App ({openEditMultipleItemsModal, showEditMultipleItemsForm}) {
  return (
    <div>
      <SCBulkActions />
      <GoalTable />
      <GoalQuickEdit />
      { showEditMultipleItemsForm ? <EditMultipleItemsForm /> : null }
    </div>
  );
}

const mapStateToProps = state => ({
  showEditMultipleItemsForm: state.getIn(['editMultipleItemsForm', 'visible']),
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(App);
