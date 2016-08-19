import _ from 'lodash';
import * as React from 'react';
import * as ReactRedux from 'react-redux';
import * as Actions from '../actions';
import * as Providers from '../../providers';

import SocrataFlannel from '../../../SocrataFlannel';
import './FeedbackFlannel.scss';

class FeedbackFlannel extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, ['usersnapOpen', 'zendeskOpen']);
  }

  componentDidMount() {
    // Initialize UserSnap.
    Providers.Usersnap.init({
      // Inject locale to localize the popup
      locale: _.get(window.serverConfig, 'locale', 'en'),
      // Restore the feedback button after the user quits UserSnap.
      // UserSnap politely exposes event listeners.
      onClose: _.wrap(this.props.hoverable, this.props.openFeedbackFlannel),
      // Inject the user so we can auto-fill some information.
      user: window.serverConfig.currentUser
    });

    // Initialize Zendesk.
    Providers.Zendesk.init({
      // Inject locale to localize the popup
      locale: _.get(window.serverConfig, 'locale', 'en'),
      // Inject the user so we can auto-fill some information.
      user: window.serverConfig.currentUser
    });
  }

  usersnapOpen() {
    this.props.closeFeedbackFlannel();
    Providers.Usersnap.activate();
  }

  zendeskOpen() {
    this.props.closeFeedbackFlannel();
    Providers.Zendesk.activate();
  }

  render() {
    const { translations, hoverable } = this.props;

    return (
      <SocrataFlannel.Wrapper hoverable={ hoverable } closeFlannel={ this.props.closeFeedbackFlannel }
                              className="feedback-flannel">
        <SocrataFlannel.Header className="header" title={ translations.get('title') }
                               closeFlannel={ this.props.closeFeedbackFlannel }/>
        <SocrataFlannel.Content className="content">
          <p className="small" dangerouslySetInnerHTML={ { __html: translations.get('message') } }/>
        </SocrataFlannel.Content>
        <SocrataFlannel.Footer className="footer">
          <button className="btn btn-primary btn-m"
                  onClick={ this.usersnapOpen }>{ translations.get('yes_include_screenshot') }</button>
          <button className="btn btn-default btn-m"
                  onClick={ this.zendeskOpen }>{ translations.get('no_thanks') }</button>
        </SocrataFlannel.Footer>
      </SocrataFlannel.Wrapper>
    );
  }
}

FeedbackFlannel.propTypes = {
  translations: React.PropTypes.object.isRequired,
  statePath: React.PropTypes.array.isRequired
};

const mapStateToProps = (state, props) => {
  const feedbackState = state.getIn(props.statePath);

  return {
    hoverable: feedbackState.get('hoverable')
  };
};

const mapDispatchToProps = dispatch => ({
  openFeedbackFlannel: target => dispatch(Actions.open(target)),
  closeFeedbackFlannel: () => dispatch(Actions.close())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(FeedbackFlannel);
