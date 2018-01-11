import React, { PureComponent } from 'react';
import propTypes from 'prop-types';
import { connect } from 'react-redux';
import I18nJS from 'common/i18n';
import * as actions from '../actions';

class RestoreModal extends PureComponent {
  render() {
    const { activity, hideRestoreModal, restoreDataset } = this.props;

    if (!activity) {
      return null;
    }

    const description = I18nJS.t(
      'screens.admin.activity_feed.restore_confirmation',
      { dataset: activity.dataset_name }
    );

    const restoreMethod = restoreDataset.bind(null, activity.dataset_uid);

    return (
      <div className="modal modal-overlay" role="dialog">
        <div className="modal-container">
          <header className="modal-header">
            <h1 className="h5 modal-header-title">
              {I18nJS.t('screens.admin.activity_feed.restore')}
            </h1>
          </header>
          <section className="modal-content">
            <div className="description">{description}</div>
          </section>
          <footer className="modal-footer">
            <div className="modal-footer-actions">
              <button className="dismiss-button btn btn-default" onClick={hideRestoreModal}>
                {I18nJS.t('screens.admin.activity_feed.cancel')}
              </button>
              <button className="accept-button btn btn-primary" onClick={restoreMethod}>
                {I18nJS.t('screens.admin.activity_feed.restore')}
              </button>
            </div>
          </footer>
        </div>
      </div>
    );
  }
}

RestoreModal.defaultProps = {
  activity: null
};

RestoreModal.propTypes = {
  activity: propTypes.object,
  hideRestoreModal: propTypes.func.isRequired,
  restoreDataset: propTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  activity: state.table.data.find((activity) => activity.dataset_uid === state.common.restoreModal)
});

const mapDispatchToProps = dispatch => ({
  hideRestoreModal: () => dispatch(actions.common.hideRestoreModal()),
  restoreDataset: (uid) => dispatch(actions.common.restoreDataset(uid))
});

export default connect(mapStateToProps, mapDispatchToProps)(RestoreModal);
