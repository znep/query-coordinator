import React  from 'react';
import { connect } from 'react-redux';
import GoalTable from './../GoalTable/GoalTable';
import GoalQuickEdit from '../../components/GoalQuickEdit';
import EditMultipleItemsForm from '../EditMultipleItemsForm/EditMultipleItemsForm';
import SocrataBulkActions from '../SocrataBulkActions';
import SocrataAlert from '../../components/SocrataAlert';
import { dismissNotification } from '../../actions/notificationActions';
import './App.scss';

function App({ notification, onDismissNotification, showEditMultipleItemsForm }) {
  let alert = null;
  if (notification.get('visible')) {
    alert = <SocrataAlert type={ notification.get('type') }
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
      <SocrataBulkActions />
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
