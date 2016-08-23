import * as React  from 'react';
import * as ReactRedux from 'react-redux';
import * as Goals from '../../sections/goals';
import * as Actions from '../../actions';
import * as Components from '../../components';

import './App.scss';

function App(props) {
  const { notification, onDismissNotification, feedbackFlannelVisible, translations } = props;

  let alert = null;
  if (notification.get('visible')) {
    alert = <Components.Socrata.Alert type={ notification.get('type') }
                                      message={ notification.get('message') }
                                      onDismiss={ onDismissNotification }/>;
  }

  let feedbackFlannel = null;
  if (feedbackFlannelVisible) {
    feedbackFlannel = <Components.Feedback.Flannel.View statePath={['feedback']} translations={translations.getIn(['admin', 'feedback_flannel'])} />;
  }

  return (
    <div className="app-container">
      <Components.PreviewBar />
      { alert }
      <Goals.Page />
      { feedbackFlannel }
    </div>
  );
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  notification: state.get('notification'),
  feedbackFlannelVisible: state.getIn(['feedback', 'visible'])
});

const mapDispatchToProps = dispatch => ({
  onDismissNotification: () => dispatch(Actions.notifications.dismissNotification())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(App);
