import * as React  from 'react';
import * as ReactRedux from 'react-redux';
import * as Feedback from '../feedback';
import * as RootActions from '../../actions';
import { SocrataBulkActions } from '../../sections/goals/components';
import SocrataAlert from '../../components/SocrataAlert';

import './HeaderBar.scss';

class HeaderBar extends React.Component {
  render() {
    const { translations, notification, onDismissNotification } = this.props;

    let alert = null;
    if (notification.get('visible')) {
      alert = <SocrataAlert
        type={ notification.get('type') }
        message={ notification.get('message') }
        onDismiss={ onDismissNotification } />;
    }

    return (
      <div className="header-bar">
        <h1>
          { translations.getIn(['admin', 'manage_performance_goals']) }
        </h1>
        { alert }
        <SocrataBulkActions />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  notification: state.get('notification')
});

const mapDispatchToProps = dispatch => ({
  openFeedbackFlannel: event => dispatch(Feedback.Flannel.actions.open(event.target)),
  onDismissNotification: () => dispatch(RootActions.notifications.dismissNotification())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(HeaderBar);
