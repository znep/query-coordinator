import React  from 'react';
import { connect } from 'react-redux';
import GoalTable from './../GoalTable/GoalTable';
import GoalQuickEdit from '../../components/GoalQuickEdit';
import EditMultipleItemsForm from '../EditMultipleItemsForm/EditMultipleItemsForm';
import SCBulkActions from '../SCBulkActions';
import SCAlert from '../../components/SCAlert';
import { dismissNotification } from '../../actions/notificationActions';
import './App.scss';

function App({ notification, onDismissNotification, showEditMultipleItemsForm }) {
  let alert = null;
  if (notification.get('visible')) {
    alert = <SCAlert type={ notification.get('type') }
                     message={ notification.get('message') }
                     onDismiss={ onDismissNotification } />;
  }

  let editMultipleItemsForm = null;
  if (showEditMultipleItemsForm) {
    editMultipleItemsForm = <EditMultipleItemsForm />;
  }

  return (
    <div>
      { alert }
      <SCBulkActions />
      <GoalTable />
      <GoalQuickEdit />
      { editMultipleItemsForm }
    </div>
  );
}

const mapStateToProps = state => ({
  showEditMultipleItemsForm: state.getIn(['editMultipleItemsForm', 'visible']),
  notification: state.get('notification')
});

const mapDispatchToProps = dispatch => ({
  onDismissNotification: () => dispatch(dismissNotification())
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
