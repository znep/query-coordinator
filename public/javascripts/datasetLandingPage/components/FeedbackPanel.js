import _ from 'lodash';
import React from 'react';
import velocity from 'velocity-animate';

import usersnap from '../lib/usersnap';
import zendesk from '../lib/zendesk';
import { ESCAPE_KEY_CODE } from '../lib/constants';

function t(key) {
  return I18n.feedback[key];
}

export var FeedbackPanel = React.createClass({
  componentDidMount: function() {
    // Copy some of the close behavior of styleguide flannels because they don't
    // support the behavior we want for the feedback panel yet.
    const self = this;
    document.body.addEventListener('keyup', function(event) {
      var key = event.which || event.keyCode;

      // ESC
      if (key === ESCAPE_KEY_CODE) {
        self.onDismissFeedback();
      }
    });
  },

  // Bring up the feedback panel when the button is clicked.
  onClickFeedback: function() {
    this.hideButton(this.showContent);

    // Initialize UserSnap.
    usersnap.init({
      // Restore the feedback button after the user quits UserSnap.
      // UserSnap politely exposes event listeners.
      onClose: _.partial(this.showButton, this.resetButtonHover),
      // Inject the user so we can auto-fill some information.
      user: window.serverConfig.currentUser
    });

    // Initialize Zendesk.
    zendesk.init({
      // Inject the user so we can auto-fill some information.
      user: window.serverConfig.currentUser
    });
  },

  // Dismiss the feedback panel as if this were a true flannel.
  onDismissFeedback: function() {
    this.hideContent(this.showButton(this.resetButtonHover));
  },

  // Load the UserSnap widget when the user wants to include a screenshot.
  onClickUsersnap: function() {
    this.hideContent(usersnap.activate);
  },

  // Load the Zendesk widget when the user doesn't want to include a screenshot.
  onClickZendesk: function() {
    this.hideContent(zendesk.activate);

    // Restore the feedback button after the user quits Zendesk.
    // The Zendesk Web Widget API is extremely limited, so we detect a change
    // in state on the iframe as a signal for completion.
    const self = this;
    const isFrameActive = function() {
      return $('.zEWidget-ticketSubmissionForm--active').length === 1;
    };
    const handleClose = function() {
      const reset = setInterval(function() {
        if (!isFrameActive()) {
          clearInterval(reset);
          self.showButton(self.resetButtonHover);
        }
      }, 100);
    };
    const onActivate = function() {
      const getFrame = setInterval(function() {
        if (isFrameActive()) {
          clearInterval(getFrame);
          handleClose();
        }
      }, 50);
    };

    onActivate();
  },

  // Various helpers to manage fancy UI transitions.
  resetButtonHover: function() {
    // Velocity doesn't allow animation to initial state, so everything is an
    // inline style override — hence the need to forcibly reset for hover style.
    this.refs.button.style.bottom = null;
  },

  showButton: function(cb) {
    velocity(this.refs.button, { bottom: '-0.35rem' }, _.iteratee(cb));
  },

  showContent: function(cb) {
    velocity(this.refs.content, { bottom: 0 }, _.iteratee(cb));
  },

  hideButton: function(cb) {
    velocity(this.refs.button, { bottom: '-10rem' }, _.iteratee(cb));
  },

  hideContent: function(cb) {
    velocity(this.refs.content, { bottom: '-22rem' }, _.iteratee(cb));
  },

  render: function() {
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
