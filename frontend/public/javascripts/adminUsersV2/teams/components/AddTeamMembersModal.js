import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';
import * as Selectors from '../../selectors';
import * as Actions from '../actions';
import * as fromTeams from '../reducers/teamsReducer';
import Button from 'common/components/Button';
import UserSearch from 'common/components/UserSearch';
import ErrorList from '../../components/ErrorList';
import flow from 'lodash/fp/flow';
import isEmpty from 'lodash/fp/isEmpty';
import map from 'lodash/fp/map';
import pick from 'lodash/fp/pick';

import { customConnect, I18nPropType } from 'common/connectUtils';

export class AddTeamMembersModal extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
    cancelModal: PropTypes.func,
    disableModal: PropTypes.bool,
    showModal: PropTypes.bool.isRequired,
    submitModal: PropTypes.func,
    ...UserSearch.propTypes
  };

  renderAddedMembers = () => {
    const { I18n, addedMembers } = this.props;
    if (isEmpty(addedMembers)) { return; }
    const listItems = addedMembers.map(displayName => (
      <li key={displayName}>{I18n.t('users.edit_team.add_team_member_success', { displayName })}</li>
    ));

    return (
      <div className="alert success">
        <ul className="alert-list">{listItems}</ul>
      </div>
    );
  };

  renderUserSearch = () => {
    const userSearchProps = pick(Object.keys(UserSearch.propTypes), this.props);

    return <UserSearch {...userSearchProps} />;
  };

  render() {
    const { I18n, cancelModal, disableModal, errors, showModal, submitModal } = this.props;

    const modalProps = {
      className: 'add-team-member',
      fullScreen: false,
      onDismiss: () => {}
    };

    const headerProps = {
      showCloseButton: false,
      title: 'Add Team Members',
      onDismiss: cancelModal
    };

    if (showModal) {
      return (
        <Modal {...modalProps}>
          <ModalHeader {...headerProps} />

          <ModalContent>
            {this.renderUserSearch()}
            {this.renderAddedMembers()}
            <ErrorList errors={errors} />
          </ModalContent>

          <ModalFooter>
            <div>
              <Button className="cancel-button" onClick={cancelModal} disabled={disableModal}>
                {I18n.t('users.add_new_users.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="add-user-confirm"
                disabled={disableModal}
                busy={disableModal}
                onClick={submitModal}
              >
                {I18n.t('users.edit_team.add_team_members')}
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      );
    } else {
      return null;
    }
  }
}

const mapStateToProps = state => ({
  ...Selectors.getTeamUserSearch(state),
  addedMembers: flow(Selectors.getTeamAddMemberSuccesses, map(fromTeams.getDisplayName))(state),
  disableModal: Selectors.getDisableAddTeamMembersModal(state),
  errors: Selectors.getTeamAddMemberErrors(state),
  showModal: Selectors.getShowAddTeamMembersModal(state)
});

const mapDispatchToProps = {
  cancelModal: Actions.cancelAddTeamMembersModal,
  submitModal: Actions.submitAddTeamMembersModal,
  addSelectedUser: Actions.userSearchAddSelectedUser,
  removeSelectedUser: Actions.userSearchRemoveSelectedUser,
  userSearchQueryChanged: event => Actions.userSearchQueryChanged(event.target.value)
};

export default customConnect({ mapStateToProps, mapDispatchToProps })(AddTeamMembersModal);
