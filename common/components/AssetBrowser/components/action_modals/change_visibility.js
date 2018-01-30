import _ from 'lodash';
import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import SocrataIcon from 'common/components/SocrataIcon';
import { changeVisibility, fetchParentVisibility } from 'common/components/AssetBrowser/actions/asset_actions';
import { handleEnter } from 'common/dom_helpers/keyPressHelpers';
import I18n from 'common/i18n';
import { assetWillEnterApprovalsQueueOnPublish } from 'common/asset/utils';

export class ChangeVisibility extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      fetchingParentVisibility: true,
      parentVisibilityIsOpen: null,
      showApprovalMessage: false,
      visibility: null
    };

    _.bindAll(this, 'canNotChangeVisibilityForAsset', 'currentAsset', 'getTranslation', 'renderModalContent');
  }

  // If the current asset has a parent dataset, we need to fetch the visibility of it
  // in order to determine if the current asset can have its visibility changed.
  componentWillMount() {
    // TODO: figure out the cases where `parent_fxf` has multiple values (based on asset type) and why,
    // and which one we should be checking the visibility of.
    const parentUid = _.first(_.get(this.currentAsset(), 'resource.parent_fxf'));

    if (parentUid) {
      this.props.fetchParentVisibility(parentUid).then(response => {
        if (_.get(response, 'results.0')) {
          this.setState({
            fetchingParentVisibility: false,
            parentVisibilityIsOpen: _.get(response, 'results.0.metadata.visible_to_anonymous')
          });
        } else {
          throw new Error(`Invalid response (could not find any results): ${JSON.stringify(response)}`);
        }
      }).catch(err => {
        console.error('Error fetching parent visibility', err);
        this.setState({
          fetchingParentVisibility: false,
          parentVisibilityIsOpen: false
        });
      });
    } else {
      this.setState({ fetchingParentVisibility: false });
    }
  }

  getTranslation(key) {
    return I18n.t(key, { scope: 'shared.asset_browser.result_list_table.action_modal.change_visibility' });
  }

  isDatalens() { // eslint-disable-line react/sort-comp
    // There are three datatypes (as Cetera returns them) that should behave like datalenses:
    // - datalens
    // - datalens_chart
    // - datalens_map
    const { assetType } = this.props;
    return assetType.startsWith('datalens');
  }

  getOptions() {
    if (this.isDatalens()) {
      return ['hidden', 'shown'];
    }
    return ['private', 'open'];
  }

  getVisibility() {
    let { visibility } = this.state;
    if (visibility === null) {
      if (this.isDatalens()) {
        visibility = this.initialVisibility().hidden ? 'hidden' : 'shown';
      } else {
        visibility = this.initialVisibility().open ? 'open' : 'private';
      }
    }
    return visibility;
  }

  initialVisibility() {
    return {
      'open': this.currentAsset().metadata.visible_to_anonymous,
      'private': !this.currentAsset().metadata.is_public,
      'hidden': this.currentAsset().metadata.is_hidden
    };
  }

  canNotChangeVisibilityForAsset() {
    const { assetType } = this.props;

    if (this.state.parentVisibilityIsOpen === true) {
      // Are these all the cases?
      return (assetType === 'chart' || assetType === 'map' || assetType === 'filter');
    } else {
      // TODO: return true for data lenses (and possibly any child view when view moderation is enabled??)
      // how does anything work
      return false;
    }
  }

  currentAsset() {
    // Get current asset's cetera properties from the results array.
    return _.find(_.filter(this.props.results, result => result.resource.id === this.props.uid));
  }

  renderModalContent() {
    const { fetchingParentVisibility } = this.state;

    if (fetchingParentVisibility) {
      return <span className="spinner-default" />;
    }

    if (this.canNotChangeVisibilityForAsset()) {
      return <div>{this.getTranslation('can_not_change_visibility')}</div>;
    }

    const setNewVisibility = (newVisibility) => {
      if (this.getVisibility() !== newVisibility) {
        this.setState({ visibility: newVisibility });
      }
    };

    const visibilityOptionClass = (option) => {
      return classNames('change-visibility-option', option, {
        active: this.getVisibility() === option ||
          (this.initialVisibility()[option] === true && this.getVisibility() === null)
      });
    };

    const iconClass = (option) => {
      if (_.includes(['open', 'shown'], option)) {
        return 'socrata-icon-public-open';
      } else if (option === 'private') {
        return 'socrata-icon-private';
      } else if (option === 'hidden') {
        return 'socrata-icon-eye-blocked';
      }
    };

    return (
      <ul className="change-visibility-options">
        {this.getOptions().map((option) => (
          <li
            className={visibilityOptionClass(option)}
            key={option}
            onClick={() => setNewVisibility(option)}
            onKeyDown={handleEnter(() => setNewVisibility(option), true)}
            tabIndex={0}>
            <div className="checkbox-container">
              <SocrataIcon name="checkmark3" />
            </div>
            <div className="option-title">{this.getTranslation(`options.${option}.title`)}</div>
            <span
              className={`option-icon ${iconClass(option)}`}
              aria-label={this.getTranslation(`options.${option}.title`)} />
            <div className="option-description">{this.getTranslation(`options.${option}.description`)}</div>
          </li>
        ))}
      </ul>
    );
  }

  render() {
    const { assetActions, assetType, onDismiss, uid } = this.props;
    const { showApprovalMessage, visibility } = this.state;

    const modalProps = { fullScreen: false, onDismiss };
    const headerProps = { onDismiss, title: this.getTranslation('title'), showCloseButton: false };

    const hasError = assetActions.performingActionFailure;
    const errorMessage = hasError ? (
      <div className="alert error">{this.getTranslation('error')}</div>
    ) : null;

    const okButtonText = assetActions.performingAction ?
      <span className="spinner-default spinner-small" /> : this.getTranslation('accept');
    const okButtonClass = classNames('accept-button btn btn-primary', {
      'btn-error': hasError,
      'hidden': this.canNotChangeVisibilityForAsset()
    });

    const assetWillBePublic = visibility === 'open';
    assetWillEnterApprovalsQueueOnPublish({ coreView: this.currentAsset(), assetWillBePublic }).then(
      (response) => {
        if (response !== showApprovalMessage) {
          this.setState({ showApprovalMessage: response });
        }
      });

    const approvalMessageClassnames =
      showApprovalMessage ? 'alert warning approval-message' : 'approval-message-placeholder';

    const approvalMessage = (
      <div className={approvalMessageClassnames}>
        {showApprovalMessage && this.getTranslation('approval_note')}
      </div>
    );

    return (
      <div className="action-modal change-visibility">
        <Modal {...modalProps} >
          <ModalHeader {...headerProps} />

          <ModalContent>
            {this.renderModalContent()}
            {approvalMessage}
            {errorMessage}
          </ModalContent>

          <ModalFooter>
            <button onClick={onDismiss} className="dismiss-button btn btn-default">
              {this.getTranslation('dismiss')}
            </button>
            <button
              onClick={() => this.props.changeVisibility(uid, assetType, this.getVisibility())}
              className={okButtonClass}>
              {okButtonText}
            </button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ChangeVisibility.propTypes = {
  assetActions: PropTypes.object.isRequired,
  assetType: PropTypes.string.isRequired,
  changeVisibility: PropTypes.func.isRequired,
  fetchParentVisibility: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  results: PropTypes.array.isRequired,
  uid: PropTypes.string.isRequired
};

const mapStateToProps = state => ({
  assetActions: state.assetActions,
  results: state.catalog.results
});

const mapDispatchToProps = dispatch => ({
  changeVisibility: (uid, assetType, newVisibility) =>
    dispatch(changeVisibility(uid, assetType, newVisibility)),
  fetchParentVisibility: (parentUid) => dispatch(fetchParentVisibility(parentUid))
});

export default connect(mapStateToProps, mapDispatchToProps)(ChangeVisibility);
