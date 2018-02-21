import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { customConnect, I18nPropType } from 'common/connectUtils';
import DropdownButton, { DropdownItem } from '../../components/DropdownButton';
import * as Actions from '../actions';
import * as Selectors from '../../selectors';

export class MemberEditControl extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
    displayName: PropTypes.string.isRequired,
    removeTeamMember: PropTypes.func.isRequired,
    teamRole: PropTypes.string.isRequired,
    teamId: PropTypes.string.isRequired,
    teamName: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired
  };

  handleRemoveTeamMember = (teamId, userId, displayName) => {
    const { I18n, removeTeamMember, teamName } = this.props;
    if (window.confirm(I18n.t('users.edit_team.confirm_remove_team_member', { displayName, teamName }))) {
      removeTeamMember(teamId, userId);
    }
  };

  render() {
    const { I18n, teamId, userId, teamRole, displayName } = this.props;
    return (
      <DropdownButton isDisabled={teamRole === 'owner'}>
        <DropdownItem onClick={() => this.handleRemoveTeamMember(teamId, userId, displayName)}>
          {I18n.t('users.edit_team.remove_team_member')}
        </DropdownItem>
      </DropdownButton>
    );
  }
}

const mapStateToProps = (state, { teamId }) => ({
  teamName: teamId ? Selectors.getTeamNameById(state, teamId) : ''
});

const mapDispatchToProps = {
  removeTeamMember: Actions.removeTeamMember
};

export default customConnect({ mapStateToProps, mapDispatchToProps })(MemberEditControl);
