import _ from 'lodash';
import React from 'react';
import velocity from 'velocity-animate';

import usersnap from '../lib/usersnap';
import zendesk from '../lib/zendesk';
import { ESCAPE_KEY_CODE } from '../../common/constants';

function t(key) {
  return I18n.feedback[key];
}

export const FeedbackPanel = React.createClass({
  componentDidMount() {
    // Copy some of the close behavior of socrata-components flannels because they don't
    // support the behavior we want for the feedback panel yet.
    document.body.addEventListener('keyup', (event) => {
      const key = event.which || event.keyCode;

      // ESC
      if (key === ESCAPE_KEY_CODE) {
        this.onDismissFeedback();
      }
    });
  },

  // Bring up the feedback panel when the button is clicked.
  onClickFeedback() {
    this.hideButton(this.showContent);

    // Initialize UserSnap.
    usersnap.init({
      // Inject locale to localize the popup
      locale: _.get(window.serverConfig, 'locale', 'en'),
      // Restore the feedback button after the user quits UserSnap.
      // UserSnap politely exposes event listeners.
      onClose: _.partial(this.showButton, this.resetButtonHover),
      // Inject the user so we can auto-fill some information.
      user: window.serverConfig.currentUser
    });

    // Initialize Zendesk.
    zendesk.init({
      // Inject locale to localize the popup
      locale: _.get(window.serverConfig, 'locale', 'en'),
      // Inject the user so we can auto-fill some information.
      user: window.serverConfig.currentUser
    });
  },

  // Dismiss the feedback panel as if this were a true flannel.
  onDismissFeedback() {
    this.hideContent(this.showButton(this.resetButtonHover));
  },

  // Load the UserSnap widget when the user wants to include a screenshot.
  onClickUsersnap() {
    this.hideContent(usersnap.activate);
  },

  // Load the Zendesk widget when the user doesn't want to include a screenshot.
  onClickZendesk() {
    this.hideContent(zendesk.activate);

    // Restore the feedback button after the user quits Zendesk.
    // The Zendesk Web Widget API is extremely limited, so we detect a change
    // in state on the iframe as a signal for completion.
    const isFrameActive = () => $('.zEWidget-ticketSubmissionForm--active').length === 1;
    const handleClose = () => {
      const reset = setInterval(() => {
        if (!isFrameActive()) {
          clearInterval(reset);
          this.showButton(self.resetButtonHover);
        }
      }, 100);
    };
    const onActivate = () => {
      const getFrame = setInterval(() => {
        if (isFrameActive()) {
          clearInterval(getFrame);
          handleClose();
        }
      }, 50);
    };

    onActivate();
  },

  // Various helpers to manage fancy UI transitions.
  resetButtonHover() {
    // Velocity doesn't allow animation to initial state, so everything is an
    // inline style override — hence the need to forcibly reset for hover style.
    this.refs.button.style.bottom = null;
  },

  showButton(cb) {
    velocity(this.refs.button, { bottom: '-0.35rem' }, _.iteratee(cb));
  },

  showContent(cb) {
    velocity(this.refs.content, { bottom: 0 }, _.iteratee(cb));
  },

  hideButton(cb) {
    velocity(this.refs.button, { bottom: '-10rem' }, _.iteratee(cb));
  },

  hideContent(cb) {
    velocity(this.refs.content, { bottom: '-22rem' }, _.iteratee(cb));
  },

  render() {
    // Feedback panel is not available unless user is logged in.
    if (!window.serverConfig.currentUser) {
      return null;
    }

    return (
      <div className="feedback-panel">
        <div className="feedback-panel-content flannel" ref="content">
          <header className="flannel-header">
            <h5>{t('panel_title')}</h5>
            <button
              aria-label={I18n.close}
              className="btn btn-transparent flannel-header-dismiss"
              onClick={this.onDismissFeedback}>
              <span className="icon-close-2" />
            </button>
          </header>
          <section className="flannel-content">
            <p className="small" dangerouslySetInnerHTML={{ __html: t('panel_details_html') }} />
            <div className="desktop">
              <button className="btn btn-primary" onClick={this.onClickUsersnap}>
                {t('screenshot_yes')}
              </button>
              <button className="btn btn-default" onClick={this.onClickZendesk}>
                {t('screenshot_no')}
              </button>
            </div>
            <div className="mobile">
              <button className="btn btn-primary btn-block" onClick={this.onClickUsersnap}>
                {t('screenshot_yes')}
              </button>
              <button className="btn btn-default btn-block" onClick={this.onClickZendesk}>
                {t('screenshot_no')}
              </button>
            </div>
          </section>
        </div>
        <button className="btn feedback-panel-button" onClick={this.onClickFeedback} ref="button">
          {t('title')}
        </button>
      </div>
    );
  }
});

export default FeedbackPanel;
