import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { openFeedbackFlannel, closeFeedbackFlannel } from '../../actions/feedbackFlannelActions';
import SocrataFlannel from '../SocrataFlannel';
import Usersnap from '../../helpers/usersnap';
import Zendesk from '../../helpers/zendesk';
import './FeedbackFlannel.scss';

class FeedbackFlannel extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, ['usersnapOpen', 'zendeskOpen']);
  }

  componentDidMount() {
    // Initialize UserSnap.
    Usersnap.init({
      // Inject locale to localize the popup
      locale: _.get(window.serverConfig, 'locale', 'en'),
      // Restore the feedback button after the user quits UserSnap.
      // UserSnap politely exposes event listeners.
      onClose: _.wrap(this.props.hoverable , this.props.openFeedbackFlannel),
      // Inject the user so we can auto-fill some information.
      user: window.serverConfig.currentUser
    });

    // Initialize Zendesk.
    Zendesk.init({
      // Inject locale to localize the popup
      locale: _.get(window.serverConfig, 'locale', 'en'),
      // Inject the user so we can auto-fill some information.
      user: window.serverConfig.currentUser
    });
  }

  usersnapOpen() {
    this.props.closeFeedbackFlannel();
    Usersnap.activate();
  }

  zendeskOpen() {
    this.props.closeFeedbackFlannel();
    Zendesk.activate();
  }

  render() {
    const { translations, hoverable } = this.props;

    return (
      <SocrataFlannel.Wrapper hoverable={ hoverable } closeFlannel={ this.props.closeFeedbackFlannel } className="feedback-flannel">
        <SocrataFlannel.Header className="header" title={ translations.get('title') } closeFlannel={ this.props.closeFeedbackFlannel }/>
        <SocrataFlannel.Content className="content">
          <p className="small" dangerouslySetInnerHTML={ { __html: translations.get('message') } } />
        </SocrataFlannel.Content>
        <SocrataFlannel.Footer className="footer">
          <button className="btn btn-primary btn-m" onClick={ this.usersnapOpen }>{ translations.get('yes_include_screenshot') }</button>
          <button className="btn btn-default btn-m" onClick={ this.zendeskOpen }>{ translations.get('no_thanks') }</button>
        </SocrataFlannel.Footer>
      </SocrataFlannel.Wrapper>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.getIn(['translations', 'admin', 'feedback_flannel']),
  hoverable: state.getIn(['feedbackFlannel', 'hoverable'])
});

const mapDispatchToProps = dispatch => ({
  openFeedbackFlannel: target =>  dispatch(openFeedbackFlannel(target)),
  closeFeedbackFlannel: () => dispatch(closeFeedbackFlannel())
});

export default connect(mapStateToProps, mapDispatchToProps)(FeedbackFlannel);
