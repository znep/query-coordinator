import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import { closeModal } from 'actions/asset_actions';
import ChangeVisibility from './action_modals/change_visibility';
import DeleteAsset from './action_modals/delete_asset';
import _ from 'lodash';
import classNames from 'classnames';

export class ActionDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeActionModal: null,
      dropdownIsOpen: false,
      fetchingPermissions: false
    };

    _.bindAll(this, 'handleDocumentClick', 'handleButtonClick', 'handleModalClose',
      'renderDeleteAssetMenuOption', 'renderDropdownOption', 'renderEditMetadataMenuOption',
      'renderChangeVisibilityMenuOption', 'showActionModal'
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
    event.stopPropagation();
    event.preventDefault();

    this.setState({
      dropdownIsOpen: !this.state.dropdownIsOpen
    });
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
    const { ownerUid } = this.props;

    if (ownerUid === _.get(serverConfig, 'currentUser.id')) {
      return this.renderDropdownOption(
        this.getTranslation('delete_asset'), () => this.showActionModal('deleteAsset')
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
        <div className="action-dropdown-menu-container">
          <span className="spinner-default"></span>
        </div>
      </div>
    );

    const actionsList = fetchingPermissions ? busySpinner : (
      <div className="action-dropdown-menu">
        {this.renderEditMetadataMenuOption()}
        {this.renderChangeVisibilityMenuOption()}
        {this.renderDeleteAssetMenuOption()}
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
  uid: PropTypes.string.isRequired,
  ownerUid: PropTypes.string.isRequired
};

const mapDispatchToProps = dispatch => ({
  closeModal: () => dispatch(closeModal())
});

export default connect(null, mapDispatchToProps)(ActionDropdown);
