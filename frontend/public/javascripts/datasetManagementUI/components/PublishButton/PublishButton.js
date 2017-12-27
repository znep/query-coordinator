/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';

import React, { Component } from 'react';
import styleguide from 'common/components';
import styles from './PublishButton.module.scss';

const FLYOUT_ID = 'publication-readiness-flyout';
const SubI18n = I18n.home_pane.publish_dataset_button;

function LabelledCheckmark({ checked, text }) {
  let checkmark;
  if (checked) {
    checkmark = <span className={styles.checked} />;
  } else {
    checkmark = (
      <svg className={styles.notChecked}>
        <circle r="7" cx="7.5" cy="7.5" />
      </svg>
    );
  }
  return (
    <div>
      {checkmark}
      <span className={styles.checkmarkLabel}>{text}</span>
    </div>
  );
}

LabelledCheckmark.propTypes = {
  checked: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired
};

function PublishReadinessFlyout(
  { metadataSatisfied, dataSatisfied, parenthoodSatisfied, requiresParenthood, isUSAID }) {
  const buttonText = isUSAID ? SubI18n.submit_for_review_flyout : SubI18n.make_accessible;
  const flyoutText = isUSAID ? SubI18n.cant_submit_until : SubI18n.cant_publish_until;
  return (
    <div id={FLYOUT_ID} className={styles.flyout}>
      <section className={styles.flyoutContent}>
        {metadataSatisfied && dataSatisfied && parenthoodSatisfied ? (
           buttonText
        ) : (
          <div>
            {flyoutText}
            <ul>
              {!requiresParenthood || <li>
                <LabelledCheckmark checked={parenthoodSatisfied} text={SubI18n.parenthood_satisfied} />
              </li>}
              <li>
                <LabelledCheckmark checked={metadataSatisfied} text={SubI18n.metadata_satisfied} />
              </li>
              <li>
                <LabelledCheckmark checked={dataSatisfied} text={SubI18n.data_satisfied} />
              </li>
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

PublishReadinessFlyout.propTypes = {
  metadataSatisfied: PropTypes.bool.isRequired,
  dataSatisfied: PropTypes.bool.isRequired,
  parenthoodSatisfied: PropTypes.bool.isRequired,
  requiresParenthood: PropTypes.bool.isRequired,
  isUSAID: PropTypes.bool.isRequired
};

class PublishButton extends Component {
  componentDidMount() {
    this.attachFlyouts();
  }

  componentDidUpdate() {
    this.attachFlyouts();
  }

  attachFlyouts() {
    if (this.flyoutButtonEl) {
      styleguide.attachTo(this.flyoutButtonEl);
    }
  }

  render() {
    const {
      publishDataset,
      metadataSatisfied,
      dataSatisfied,
      parenthoodSatisfied,
      publishing,
      requiresParenthood
    } = this.props;
    const readyToPublish = metadataSatisfied && dataSatisfied && parenthoodSatisfied;
    const isUSAID = window.serverConfig.featureFlags.usaid_features_enabled;

    return (
      <div
        ref={element => {
          this.flyoutButtonEl = element;
        }}>
        <div data-flyout={FLYOUT_ID}>
          <button
            className={styles.publishButton}
            onClick={() => publishDataset('PublishConfirmation')}
            disabled={!readyToPublish || publishing}>
            {isUSAID && SubI18n.submit_for_review}
            {isUSAID || SubI18n.publish_dataset}
          </button>
        </div>
        <PublishReadinessFlyout
          dataSatisfied={dataSatisfied}
          metadataSatisfied={metadataSatisfied}
          parenthoodSatisfied={parenthoodSatisfied}
          requiresParenthood={requiresParenthood}
          isUSAID={isUSAID}
          hide={publishing} />
      </div>
    );
  }
}

PublishButton.propTypes = {
  metadataSatisfied: PropTypes.bool.isRequired,
  dataSatisfied: PropTypes.bool.isRequired,
  parenthoodSatisfied: PropTypes.bool.isRequired,
  publishing: PropTypes.bool.isRequired,
  requiresParenthood: PropTypes.bool.isRequired,
  publishDataset: PropTypes.func.isRequired
};

export default PublishButton;
