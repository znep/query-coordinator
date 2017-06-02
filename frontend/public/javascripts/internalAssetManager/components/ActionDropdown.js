import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import ActionModal from './ActionModal';
import { closeModal, deleteAsset } from '../actions/assetActions';
import { handleEnter } from '../../common/helpers/keyPressHelpers';
import _ from 'lodash';
import classNames from 'classnames';

export class ActionDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      actionModalIsOpen: false,
      isOpen: false,
      selectedAction: null
    };

    _.bindAll(this, [
      'handleDocumentClick',
      'handleButtonClick',
      'closeActionModal',
      'showActionModal'
    ]);
  }

  componentDidMount() {
    this.mounted = true;
    document.addEventListener('click', this.handleDocumentClick, false);
  }

  componentWillUnmount() {
    this.mounted = false;
    document.removeEventListener('click', this.handleDocumentClick, false);
  }

  handleDocumentClick(event) {
    if (this.mounted) {
      if (!ReactDOM.findDOMNode(this).contains(event.target)) {
        this.setState({ isOpen: false });
      }
    }
  }

  handleButtonClick(event) {
    event.stopPropagation();
    event.preventDefault();

    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  showActionModal(actionType) {
    this.setState({ isOpen: false, actionModalIsOpen: true, selectedAction: actionType });
  }

  closeActionModal() {
    this.props.closeModal();
    this.setState({ actionModalIsOpen: false, selectedAction: null });
  }

  render() {
    const { uid } = this.props;
    const { actionModalIsOpen, isOpen, selectedAction } = this.state;

    const dropdownButtonClass = classNames('action-dropdown-button', { active: isOpen });

    const dropdownButton = (
      <button
        className={dropdownButtonClass}
        onClick={this.handleButtonClick}
        role="button">
        <span
          className="socrata-icon-arrow-down"
          alt={_.get(I18n, 'result_list_table.action_dropdown.title')} />
      </button>
    );

    // These map to the dispatched Action names as well as the snake_cased translation keys.
    const menuActions = [
      'addCollaborators',
      'editMetadata',
      'changeVisibility',
      'changePermissions',
      'transferOwnership',
      'deleteAsset'
    ];

    const renderedMenuActions = menuActions.map((actionType) => {
      const actionTitle = _.get(I18n, `result_list_table.action_dropdown.${_.snakeCase(actionType)}`);

      return (
        <li
          key={actionType}
          tabIndex={0}
          onClick={() => this.showActionModal(actionType)}
          onKeyDown={handleEnter(() => this.showActionModal(actionType), true)}>
          {actionTitle}
        </li>
      );
    });

    const dropdownMenu = isOpen ? (
      <ul className="action-dropdown-menu">
        {renderedMenuActions}
      </ul>
    ) : null;

    // selectedAction name maps to the dispatched action name.
    const actionDispatch = this.props[selectedAction];
    const actionModal = actionModalIsOpen ? (
      <ActionModal
        actionType={selectedAction}
        onAccept={() => actionDispatch(uid)}
        onDismiss={this.closeActionModal} />
    ) : null;

    return (
      <div className="action-dropdown">
        {dropdownButton}
        {dropdownMenu}
        {actionModal}
      </div>
    );
  }
}

ActionDropdown.propTypes = {
  closeModal: PropTypes.func.isRequired,
  deleteAsset: PropTypes.func.isRequired,
  uid: PropTypes.string.isRequired
};

const mapDispatchToProps = dispatch => ({
  closeModal: () => dispatch(closeModal()),
  deleteAsset: (uid) => dispatch(deleteAsset(uid))
});

export default connect(null, mapDispatchToProps)(ActionDropdown);
