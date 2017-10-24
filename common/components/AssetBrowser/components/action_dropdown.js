import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import { defaultHeaders, checkStatus } from 'common/http';
import I18n from 'common/i18n';

import * as assetActions from '../actions/asset_actions';
import ChangeVisibility from './action_modals/change_visibility';
import DeleteAsset from './action_modals/delete_asset';

const initialReactState = (options = {}) => {
  return {
    allowableActions: [],
    dropdownIsOpen: false,
    failedPermissions: false,
    fetchingPermissions: false,
    verifiedPermissions: false,
    ...options
  };
};

export class ActionDropdown extends Component {
  constructor(props) {
    super(props);

    this.state = initialReactState();

    _.bindAll(this, 'fetchPermissions', 'handleButtonClick', 'handleDocumentClick', 'handleModalClose',
      'renderDeleteAssetMenuOption', 'renderEditMetadataMenuOption', 'renderChangeVisibilityMenuOption',
      'showActionModal', 'permissionsError', 'verifyPermissions'
    );
  }

  componentDidMount() {
    this.mounted = true;
    document.addEventListener('click', this.handleDocumentClick, false);
  }

  componentWillUnmount() {
    this.mounted = false;
    document.removeEventListener('click', this.handleDocumentClick, false);
  }

  getTranslation(key) {
    return I18n.t(`shared.asset_browser.result_list_table.action_dropdown.${key}`);
  }

  handleButtonClick(event) {
    const { dropdownIsOpen, failedPermissions, verifiedPermissions } = this.state;

    event.stopPropagation();
    event.preventDefault();

    if (verifiedPermissions === false && failedPermissions === false) {
      this.fetchPermissions();
    }

    this.setState({
      dropdownIsOpen: dropdownIsOpen === false
    });
  }

  fetchPermissions() {
    const { uid } = this.props;
    const fetchOptions = {
      method: 'GET',
      credentials: 'same-origin',
      headers: defaultHeaders
    };

    this.setState({
      fetchingPermissions: true
    });

    fetch(`/api/views/${uid}.json`, fetchOptions).
      then(checkStatus).
      then((response) => response.json().then(this.verifyPermissions)).
      catch(this.permissionsError);
  }

  permissionsError(result) {
    console.error('Permissions verification failed: status = ', _.get(result, 'response.status'));
    this.setState(initialReactState({
      failedPermissions: true,
      fetchingPermissions: false,
      verifyPermissions: false
    }));
  }

  verifyPermissions(view) {
    const { verifiedPermissions } = this.state;
    const allowableActions = [];

    if (verifiedPermissions === false) {
      if (view !== null) {
        if (_(view.rights).includes('delete') || _(view.rights).includes('delete_view')) {
          allowableActions.push('delete_asset');
        }
        if (_(view.rights).includes('write') || _(view.rights).includes('update_view')) {
          allowableActions.push('change_visibility');
          allowableActions.push('edit_metadata');
        }
      }

      this.setState({
        allowableActions,
        fetchingPermissions: false,
        verifiedPermissions: true
      });
    }
  }

  handleModalClose() {
    this.props.closeModal();
  }

  handleDocumentClick(event) {
    if (this.mounted) {
      if (!ReactDOM.findDOMNode(this).contains(event.target)) {
        this.setState({ dropdownIsOpen: false });
      }
    }
  }

  showActionModal(modalType, uid) {
    this.props.showModal(modalType, uid);
  }

  renderDropdownOption(optionText, onClick, href = '#') {
    return <a href={href} onClick={onClick} tabIndex={0}>{optionText}</a>;
  }

  renderEditMetadataMenuOption() {
    const { assetType, uid } = this.props;
    const { allowableActions } = this.state;

    if (!_(allowableActions).includes('edit_metadata')) {
      return null;
    }

    switch (assetType) {
      case 'story':
      case 'datalens':
        return null; // EN-17219: (temporary fix)
      default:
        return this.renderDropdownOption(
          this.getTranslation('edit_metadata'),
          _.noop,
          `/d/${uid}/edit_metadata`
        );
    }
  }

  renderChangeVisibilityMenuOption() {
    const { allowableActions } = this.state;
    const { uid } = this.props;

    if (!_(allowableActions).includes('change_visibility')) {
      return null;
    }

    switch (this.props.assetType) {
      case 'story':
        /* TODO: Need to do something different if a story is unpublished vs published:
          - just link to the story if it's unpublished.
          - if it is published, use the storyteller api to toggle permissions, not the core api directly.
          (in asset_actions) */
      case 'datalens': // eslint-disable-line no-fallthrough
        // TODO: Implement the "hidden" checkbox and use that for data lenses.
      case 'visualization': // eslint-disable-line no-fallthrough
        // TODO: Implement once new viz bootstrapping / permissions are ready to go.
        return null;
      default:
        return this.renderDropdownOption(
          this.getTranslation('change_visibility'),
          () => this.showActionModal('changeVisibility', uid)
        );
    }
  }

  renderDeleteAssetMenuOption() {
    const { allowableActions } = this.state;

    if (_(allowableActions).includes('delete_asset')) {
      return this.renderDropdownOption(
        this.getTranslation('delete_asset'), () => this.showActionModal('deleteAsset', this.props.uid)
      );
    }
  }

  renderNoActionsPossible() {
    return (
      <div className="no-actions-possible">
        {this.getTranslation('no_actions_possible')}
      </div>
    );
  }

  renderErrorMessage() {
    return (
      <div className="error-message">
        {this.getTranslation('permissions_error')}
      </div>
    );
  }

  render() {
    const { assetType, uid } = this.props;
    const { allowableActions, dropdownIsOpen, failedPermissions, fetchingPermissions } = this.state;

    const actionDropdownButton = (
      <button
        aria-label={this.getTranslation('title')}
        className={classNames('action-dropdown-button', { active: dropdownIsOpen })}
        onClick={this.handleButtonClick}
        role="button">
        <span className="socrata-icon-waiting" alt={this.getTranslation('title')} />
      </button>
    );

    const busySpinner = (
      <div className="action-dropdown-spinner-container">
        <span className="spinner-default"></span>
      </div>
    );

    const actionMenu = (
      <div className="action-dropdown-menu">
        {this.renderEditMetadataMenuOption()}
        {this.renderChangeVisibilityMenuOption()}
        {this.renderDeleteAssetMenuOption()}
      </div>
    );

    const wrapContent = (content) => <div className="action-dropdown-content">{content}</div>;

    let actionDropdownContent = null;
    if (dropdownIsOpen) {
      if (fetchingPermissions) {
        actionDropdownContent = wrapContent(busySpinner);
      } else {
        actionDropdownContent = wrapContent(actionMenu);

        if (_.isEmpty(allowableActions)) {
          actionDropdownContent = wrapContent(this.renderNoActionsPossible());
        }

        if (failedPermissions) {
          actionDropdownContent = wrapContent(this.renderErrorMessage());
        }
      }
    }

    const actionModalProps = {
      assetType,
      onDismiss: this.handleModalClose,
      uid
    };

    // Keys must map to the name of the activeActionModalType from the application state.
    const actionModals = {
      changeVisibility: <ChangeVisibility {...actionModalProps} />,
      deleteAsset: <DeleteAsset {...actionModalProps} />
    };

    const renderedActionModal = this.props.activeActionForUid === uid ?
      actionModals[this.props.activeActionModalType] : null;

    return (
      <div className="action-dropdown">
        {actionDropdownButton}
        {actionDropdownContent}
        {renderedActionModal}
      </div>
    );
  }
}

ActionDropdown.propTypes = {
  activeActionModalType: PropTypes.string,
  activeActionForUid: PropTypes.string,
  assetType: PropTypes.string.isRequired,
  closeModal: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  uid: PropTypes.string.isRequired
};

const mapStateToProps = (state) => ({
  activeActionModalType: state.assetActions.activeActionModalType,
  activeActionForUid: state.assetActions.activeActionForUid
});

const mapDispatchToProps = (dispatch) => ({
  closeModal: () => dispatch(assetActions.closeModal()),
  showModal: (modalType, uid) => dispatch(assetActions.showModal(modalType, uid))
});

export default connect(mapStateToProps, mapDispatchToProps)(ActionDropdown);