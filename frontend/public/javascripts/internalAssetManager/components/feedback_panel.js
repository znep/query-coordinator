import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import CommonFeedbackPanel from 'common/components/FeedbackPanel';

const FeedbackPanel = ({ store }) => (
  <Provider store={store}>
    <CommonFeedbackPanel {...window.serverConfig} buttonPosition="bottom" />
  </Provider>
);

FeedbackPanel.propTypes = {
  store: PropTypes.object.isRequired
};

export default FeedbackPanel;
