import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import styleguide from 'common/components';
import { showModal } from 'actions/modal';
import * as ApplyRevision from '../actions/applyRevision';
import * as Selectors from '../selectors';
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

export class PublishButton extends Component {
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
    const modalName = window.serverConfig.featureFlags.usaidFeaturesEnabled
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

function isDataSatisfied(state) {
  if (window.serverConfig.featureFlags.usaidFeaturesEnabled) {
    return true;
  }
  let dataSatisfied;
  const outputSchema = Selectors.latestOutputSchema(state.entities);
  if (outputSchema) {
    const inputSchema = state.entities.input_schemas[outputSchema.input_schema_id];
    const columns = Selectors.columnsForOutputSchema(state.entities, outputSchema.id);
    dataSatisfied = Selectors.allTransformsDone(columns, inputSchema);
  } else {
    dataSatisfied = false;
  }
  return dataSatisfied;
}

function mapStateToProps(state) {
  const dataSatisfied = isDataSatisfied(state);
  const view = state.entities.views[state.ui.routing.fourfour];
  return {
    metadataSatisfied: view.datasetMetadataErrors.length === 0,
    dataSatisfied,
    publishedOrPublishing:
      _.size(
        _.filter(
          state.entities.task_sets,
          set =>
            set.status === ApplyRevision.TASK_SET_SUCCESSFUL ||
            set.status === ApplyRevision.TASK_SET_IN_PROGRESS
        )
      ) > 0
  };
}

function mapDispatchToProps(dispatch) {
  return {
    publishDataset: modalName => {
      dispatch(showModal(modalName));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PublishButton);
