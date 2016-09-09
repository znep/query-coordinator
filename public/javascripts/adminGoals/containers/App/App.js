import * as React  from 'react';
import * as ReactRedux from 'react-redux';
import * as Goals from '../../sections/goals';
import * as Components from '../../components';

import './App.scss';

function App(props) {
  const { feedbackFlannelVisible, translations } = props;

  let feedbackFlannel = null;
  if (feedbackFlannelVisible) {
    feedbackFlannel = <Components.Feedback.Flannel.View statePath={['feedback']} translations={translations.getIn(['admin', 'feedback_flannel'])} />;
  }

  return (
    <div className="app-container">
      <Components.PreviewBar />
      <Goals.Page />
      { feedbackFlannel }
    </div>
  );
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  feedbackFlannelVisible: state.getIn(['feedback', 'visible'])
});

export default ReactRedux.connect(mapStateToProps, null)(App);
