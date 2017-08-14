/* eslint react/jsx-indent: 0 */
import React, { PropTypes, Component } from 'react';
import styleguide from 'common/components';
import styles from 'styles/PublishButton.scss';

const FLYOUT_ID = 'publication-readiness-flyout';
const SubI18n = I18n.home_pane.publish_dataset_button;

function LabelledCheckmark({ checked, text }) {
  let checkmark;
  if (checked) {
    checkmark = <span className={styles.checked} />;
  } else {
    checkmark = (
      <svg className={styles.notChecked}>
        <circle />
      </svg>
    );
  }
  return (
    <div>
      {checkmark}
      <span className={styles.checkmarkLabel}>
        {text}
      </span>
    </div>
  );
}

LabelledCheckmark.propTypes = {
  checked: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired
};

function PublishReadinessFlyout({ metadataSatisfied, dataSatisfied }) {
  return (
    <div id={FLYOUT_ID} className={styles.flyout}>
      <section className={styles.flyoutContent}>
        {metadataSatisfied && dataSatisfied
          ? SubI18n.make_accessible
          : <div>
              {SubI18n.cant_publish_until}
              <ul>
                <li>
                  <LabelledCheckmark checked={metadataSatisfied} text={SubI18n.metadata_satisfied} />
                </li>
                <li>
                  <LabelledCheckmark checked={dataSatisfied} text={SubI18n.data_satisfied} />
                </li>
              </ul>
            </div>}
      </section>
    </div>
  );
}

PublishReadinessFlyout.propTypes = {
  metadataSatisfied: PropTypes.bool.isRequired,
  dataSatisfied: PropTypes.bool.isRequired
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
    const { publishDataset, metadataSatisfied, dataSatisfied, publishedOrPublishing } = this.props;
    const readyToPublish = metadataSatisfied && dataSatisfied;
    const modalName = window.serverConfig.featureFlags.usaid_features_enabled
      ? 'PublishConfirmationUSAID'
      : 'PublishConfirmation';

    return (
      <div
        ref={element => {
          this.flyoutButtonEl = element;
        }}>
        <div data-flyout={FLYOUT_ID}>
          <button
            className={styles.publishButton}
            onClick={() => publishDataset(modalName)}
            disabled={!readyToPublish || publishedOrPublishing}>
            {SubI18n.publish_dataset}
          </button>
        </div>
        <PublishReadinessFlyout
          dataSatisfied={dataSatisfied}
          metadataSatisfied={metadataSatisfied}
          hide={publishedOrPublishing} />
      </div>
    );
  }
}

PublishButton.propTypes = {
  metadataSatisfied: PropTypes.bool.isRequired,
  dataSatisfied: PropTypes.bool.isRequired,
  publishedOrPublishing: PropTypes.bool.isRequired,
  publishDataset: PropTypes.func.isRequired
};

export default PublishButton;
