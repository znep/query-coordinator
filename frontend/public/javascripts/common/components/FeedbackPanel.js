import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import velocity from 'velocity-animate';
import classNames from 'classnames';

import usersnap from '../usersnap';
import zendesk from '../zendesk';
import { ESCAPE } from 'common/dom_helpers/keycodes';

function t(key) {
  return I18n.common.feedback[key];
}

export class FeedbackPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoadingUsersnap: false
    };

    _.bindAll(this,
      'onDismissFeedback',
      'onClickFeedback',
      'onClickUsersnap',
      'onClickZendesk',
      'hideButton',
      'hideContent',
      'resetButtonHover',
      'showButton',
      'showContent',
      'tryEscDismiss'
    );
  }

  componentDidMount() {
    if (this.content) {
      this.makeElementAndChildrenInaccessible(this.content);
    }
  }

  // Bring up the feedback panel when the button is clicked.
  onClickFeedback() {
    const { currentUser, usersnapProjectID } = this.props;
    const locale = this.props.locale || 'en';

    this.hideButton(this.showContent);

    // Initialize UserSnap.
    usersnap.init(usersnapProjectID, {
      locale: locale,
      // Restore the feedback button after the user quits UserSnap.
      // UserSnap politely exposes event listeners.
      //
      // NOTE: The onClose event will fire during usersnap.init if your domain
      // is localhost; they also emit a console notice which indicates that they
      // mess with localhost invocations. If you see the button reappear when
      // you open the panel for the first time, this is the reason. You can see
      // a more accurate behavior if you use a substitute domain like local.dev.
      onClose: () => this.showButton(this.resetButtonHover),
      user: currentUser
    });

    // Initialize Zendesk.
    zendesk.init({
      locale: locale,
      user: currentUser
    });
  }

  // Dismiss the feedback panel as if this were a true flannel.
  onDismissFeedback() {
    this.hideContent(this.showButton(this.resetButtonHover));
  }

  // Load the UserSnap widget when the user wants to include a screenshot.
  onClickUsersnap() {
    this.setState({ isLoadingUsersnap: true });

    usersnap.activate().then(() => {
      this.setState({ isLoadingUsersnap: false });
      this.hideContent();
    });
  }

  // Load the Zendesk widget when the user doesn't want to include a screenshot.
  onClickZendesk() {
    this.hideContent(zendesk.activate);

    // Restore the feedback button after the user quits Zendesk.
    // The Zendesk Web Widget API is extremely limited, so we detect a change
    // in state on the iframe as a signal for completion.
    const isFrameActive = () => $('.zEWidget-webWidget--active').length === 1;
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
  }

  // Various helpers to manage fancy UI transitions.
  resetButtonHover() {
    // Velocity doesn't allow animation to initial state, so everything is an
    // inline style override — hence the need to forcibly reset for hover style.
    if (this.props.buttonPosition === 'right') {
      this.button.style.right = null;
    } else if (this.props.buttonPosition === 'bottom') {
      this.button.style.bottom = null;
    }
  }

  showButton(cb) {
    let targetStyle;
    if (this.props.buttonPosition === 'right') {
      targetStyle = { right: '-2.2rem' };
    } else if (this.props.buttonPosition === 'bottom') {
      targetStyle = { bottom: '-0.4rem' };
    }
    velocity(this.button, targetStyle, _.iteratee(cb));

    this.makeElementAndChildrenAccessible(this.button);
    this.button.focus();
  }

  showContent(cb) {
    velocity(this.content, { bottom: 0 }, _.iteratee(cb));

    this.makeElementAndChildrenAccessible(this.content);
    this.dismiss.focus();
  }

  hideButton(cb) {
    let targetStyle;
    if (this.props.buttonPosition === 'right') {
      targetStyle = { right: '-12rem' };
    } else if (this.props.buttonPosition === 'bottom') {
      targetStyle = { bottom: '-12rem' };
    }
    velocity(this.button, targetStyle, _.iteratee(cb));
    this.makeElementAndChildrenInaccessible(this.button);
  }

  hideContent(cb) {
    velocity(this.content, { bottom: '-22rem' }, _.iteratee(cb));
    this.makeElementAndChildrenInaccessible(this.content);
  }

  // TODO: Update this to use the helper function from styleguide once available (see EN-11381)
  makeElementAndChildrenAccessible(element) {
    element.removeAttribute('aria-hidden');
    element.removeAttribute('tabindex');

    // reset tabindex on the focusable children
    _.each(element.querySelectorAll('a, button'), (child) => {
      child.removeAttribute('tabindex');
    });
  }

  // TODO: Update this to use the helper function from styleguide once available (see EN-11381)
  makeElementAndChildrenInaccessible(element) {
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('tabindex', '-1');

    // set tabindex on the focusable children
    _.each(element.querySelectorAll('a, button'), (child) => {
      child.setAttribute('tabindex', '-1');
    });
  }

  tryEscDismiss(event) {
    // Copy some of the close behavior of common/components flannels because they don't
    // support the behavior we want for the feedback panel yet.
    if (event.keyCode === ESCAPE) {
      this.onDismissFeedback();
    }
  }

  renderUsersnapButton(isMobile) {
    const { isLoadingUsersnap } = this.state;

    const classes = classNames('btn btn-primary', {
      'btn-busy': isLoadingUsersnap,
      'btn-block': isMobile
    });

    const content = isLoadingUsersnap ?
      <div className="spinner spinner-default" /> :
      t('screenshot_yes');

    const onClick = isLoadingUsersnap ? null : this.onClickUsersnap;

    return <button className={classes} onClick={onClick}>{content}</button>;
  }

  render() {
    // Feedback panel is not available unless user is logged in.
    if (!this.props.currentUser) {
      return null;
    }

    return (
      <div className="feedback-panel" onKeyUp={this.tryEscDismiss}>
        <div className="feedback-panel-content flannel" ref={(ref) => this.content = ref}>
          <header className="flannel-header">
            <h5>{t('panel_title')}</h5>
            <button
              aria-label={I18n.close}
              className="btn btn-transparent flannel-header-dismiss"
              onClick={this.onDismissFeedback}
              ref={(ref) => this.dismiss = ref}>
              <span className="icon-close-2" />
            </button>
          </header>

          <section className="flannel-content">
            <p className="small" dangerouslySetInnerHTML={{ __html: t('panel_details_html') }} />
            <div className="desktop">
              {this.renderUsersnapButton(false)}
              <button className="btn btn-default" onClick={this.onClickZendesk}>
                {t('screenshot_no')}
              </button>
            </div>
            <div className="mobile">
              {this.renderUsersnapButton(true)}
              <button className="btn btn-default btn-block" onClick={this.onClickZendesk}>
                {t('screenshot_no')}
              </button>
            </div>
          </section>
        </div>
        <button
          className={['btn', 'feedback-panel-button', this.props.buttonPosition].join(' ')}
          onClick={this.onClickFeedback}
          ref={(ref) => this.button = ref}>
          {t('title')}
        </button>
      </div>
    );
  }
}

FeedbackPanel.propTypes = {
  currentUser: PropTypes.object,
  locale: PropTypes.string,
  usersnapProjectID: PropTypes.string.isRequired,
  buttonPosition: PropTypes.oneOf(['bottom', 'right']).isRequired
};

FeedbackPanel.defaultProps = {
  buttonPosition: 'right'
};

export default FeedbackPanel;
