import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import CommonFeedbackPanel from 'frontend/public/javascripts/common/components/FeedbackPanel';

export const FeedbackPanel = ({ store }) => (
  <Provider store={store}>
    <CommonFeedbackPanel {...window.serverConfig} buttonPosition="bottom" />
  </Provider>
);

FeedbackPanel.propTypes = {
  store: PropTypes.object.isRequired
};

export default FeedbackPanel;
