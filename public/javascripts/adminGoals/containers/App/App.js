import React  from 'react';
import { connect } from 'react-redux';
import GoalTable from './../GoalTable/GoalTable';
import QuickEditForm from '../QuickEditForm/QuickEditForm';
import EditMultipleItemsForm from '../EditMultipleItemsForm/EditMultipleItemsForm';
import SocrataBulkActions from '../SocrataBulkActions';
import SocrataAlert from '../../components/SocrataAlert';
import PreviewBar from '../../components/PreviewBar/PreviewBar';
import { dismissNotification } from '../../actions/notificationActions';
import './App.scss';

function App(props) {
  let {
    notification,
    onDismissNotification,
    showEditMultipleItemsForm,
    goalQuickEditOpenGoalId } = props;

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

  let quickEditForm = null;
  if (goalQuickEditOpenGoalId) {
    quickEditForm = <QuickEditForm />;
  }

  return (
    <div className="app-container">
      <PreviewBar />
      { alert }
      <SocrataBulkActions />
      <GoalTable />
      { quickEditForm }
      { editMultipleItemsForm }
    </div>
  );
}

const mapStateToProps = state => ({
  showEditMultipleItemsForm: state.getIn(['editMultipleItemsForm', 'visible']),
  notification: state.get('notification'),
  goalQuickEditOpenGoalId: state.getIn(['quickEditForm', 'goalId'])
});

const mapDispatchToProps = dispatch => ({
  onDismissNotification: () => dispatch(dismissNotification())
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
