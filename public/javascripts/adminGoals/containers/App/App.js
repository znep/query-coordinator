import * as React  from 'react';
import * as ReactRedux from 'react-redux';
import * as Goals from '../../sections/goals';
import * as Actions from '../../actions';

import SocrataAlert from '../../components/SocrataAlert';
import './App.scss';

function App(props) {
  const { notification, onDismissNotification } = props;

  return (
    <div>
      { notification.get('visible') &&
      <SocrataAlert type={ notification.get('type') }
                    message={ notification.get('message') }
                    onDismiss={ onDismissNotification }/>
      }
      <Goals.Page />
    </div>
  );
}

const mapStateToProps = state => ({
  showEditMultipleItemsForm: state.getIn(['editMultipleItemsForm', 'visible']),
  notification: state.get('notification')
});

const mapDispatchToProps = dispatch => ({
  onDismissNotification: () => dispatch(Actions.notifications.dismissNotification())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(App);
