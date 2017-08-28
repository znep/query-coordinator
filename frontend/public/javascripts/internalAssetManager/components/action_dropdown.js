import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import classNames from 'classnames';

import { defaultHeaders, checkStatus } from 'common/http';

import { closeModal, fetchPermissions } from 'actions/asset_actions';
import ChangeVisibility from './action_modals/change_visibility';
import DeleteAsset from './action_modals/delete_asset';

export class ActionDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeActionModal: null,
      dropdownIsOpen: false,
      fetchingPermissions: false,
      verifiedPermissions: false,
      view: null,
      allowableActions: []
    };

    _.bindAll(this, 'handleDocumentClick', 'handleButtonClick', 'handleModalClose',
      'renderDeleteAssetMenuOption', 'renderDropdownOption', 'renderEditMetadataMenuOption',
      'renderChangeVisibilityMenuOption', 'showActionModal', 'permissionsError', 'verifyPermissions'
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
    return _.get(I18n, `result_list_table.action_dropdown.${key}`);
  }

  handleButtonClick(event) {
    const { verifiedPermissions } = this.state;
    const { ownerUid, uid } = this.props;

    event.stopPropagation();
    event.preventDefault();

    const fetchOptions = {
      method: 'GET',
      credentials: 'same-origin',
      headers: defaultHeaders
    };

    if (verifiedPermissions === false) {
      this.setState({
        fetchingPermissions: true
      });
      fetch(`/api/views/${uid}.json`, fetchOptions).
        then(checkStatus).
        then((response) => response.json().then(this.verifyPermissions)).
        catch(this.permissionsError)
    }

    this.setState({
      dropdownIsOpen: !this.state.dropdownIsOpen
    });
  }

    this.setState({
      allowableActions: [],
      fetchingPermissions: false,
      verifiedPermissions: false,
      view: null
    });
  permissionsError(result) {
    console.error('Permissions verification failed: status = ', result.response.status);
  }

  verifyPermissions(view) {
    const { verifiedPermissions } = this.state;
    let allowableActions = [];

    if (verifiedPermissions === false) {
      if (view !== null) {
        if (view.rights.includes('delete') || view.rights.includes('delete_view')) {
          allowableActions.push('delete_asset');
        }
        if (view.rights.includes('write') || view.rights.includes('update_view')) {
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
    this.setState({ activeActionModal: null });
    this.props.closeModal();
  }

  handleDocumentClick(event) {
    if (this.mounted) {
      if (!ReactDOM.findDOMNode(this).contains(event.target)) {
        this.setState({ dropdownIsOpen: false });
      }
    }
  }

  showActionModal(actionName) {
    this.setState({ activeActionModal: actionName });
  }

  renderDropdownOption(optionText, onClick, href = '#') {
    return <a href={href} onClick={onClick} tabIndex={0}>{optionText}</a>;
  }

  renderEditMetadataMenuOption() {
    const { assetType, uid } = this.props;
    const { allowableActions } = this.state;

    if (!allowableActions.includes('edit_metadata')) {
      return null;
    }

    switch (assetType) {
      case 'story':
      case 'datalens':
        return null; // EN-17219: (temporary fix)
      default:
        return this.renderDropdownOption(
          _.get(I18n, 'result_list_table.action_dropdown.edit_metadata'),
          _.noop,
          `/d/${uid}/edit_metadata`
        );
    }
  }

  renderChangeVisibilityMenuOption() {
    const { allowableActions } = this.state;

    if (!allowableActions.includes('change_visibility')) {
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
          _.get(I18n, 'result_list_table.action_dropdown.change_visibility'),
          () => this.showActionModal('changeVisibility')
        );
    }
  }

  renderDeleteAssetMenuOption() {
    const { allowableActions } = this.state;

    if (allowableActions.includes('delete_asset')) {
      return this.renderDropdownOption(
        this.getTranslation('delete_asset'), () => this.showActionModal('deleteAsset')
      );
    }
  }

  renderNoActionsAllowed() {
    const { allowableActions } = this.state;

    if (_.isEmpty(allowableActions)) {
      return (
        <div className="no-actions-possible">
          {this.getTranslation('no_actions_possible')}
        </div>
      );
    }
  }

  render() {
    const { assetType, uid } = this.props;
    const { dropdownIsOpen, fetchingPermissions } = this.state;

    const dropdownButton = (
      <button
        aria-label={this.getTranslation('title')}
        className={classNames('action-dropdown-button', { active: dropdownIsOpen })}
        onClick={this.handleButtonClick}
        role="button">
        <span className="socrata-icon-waiting" alt={this.getTranslation('title')} />
      </button>
    );

    const busySpinner = (
      <div className="action-dropdown-menu">
        <div className="action-dropdown-spinner-container">
          <span className="spinner-default"></span>
        </div>
      </div>
    );

    const actionsList = fetchingPermissions ? busySpinner : (
      <div className="action-dropdown-menu">
        {this.renderEditMetadataMenuOption()}
        {this.renderChangeVisibilityMenuOption()}
        {this.renderDeleteAssetMenuOption()}
        {this.renderNoActionsAllowed()}
      </div>
    );

    const dropdownMenu = dropdownIsOpen ? actionsList : null;

    const actionModalProps = {
      assetType,
      onDismiss: this.handleModalClose,
      uid
    };

    // Keys must map to the name of the activeActionModal on the component state.
    const actionModals = {
      changeVisibility: <ChangeVisibility {...actionModalProps} />,
      deleteAsset: <DeleteAsset {...actionModalProps} />
    };

    const renderedActionModal = actionModals[this.state.activeActionModal];

    return (
      <div className="action-dropdown">
        {dropdownButton}
        {dropdownMenu}
        {renderedActionModal}
      </div>
    );
  }
}

ActionDropdown.propTypes = {
  assetType: PropTypes.string.isRequired,
  closeModal: PropTypes.func.isRequired,
  uid: PropTypes.string.isRequired
};

const mapDispatchToProps = dispatch => ({
  closeModal: () => dispatch(closeModal())
});

export default connect(null, mapDispatchToProps)(ActionDropdown);
