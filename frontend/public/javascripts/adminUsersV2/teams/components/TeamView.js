import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { customConnect, I18nPropType } from 'common/connectUtils';
import * as Selectors from '../../selectors';
import * as Actions from '../actions';
import { Link } from 'react-router';
import AddTeamMembersModal from './AddTeamMembersModal';
import EditTeamModal from './EditTeamModal';
import TeamListTable from './TeamListTable';
import SocrataIcon from 'common/components/SocrataIcon';
import Button from 'common/components/Button';

class TeamView extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired
  };

  componentWillMount() {
    const { teamViewNavigation, teamId } = this.props;
    teamViewNavigation(teamId);
  }

  render() {
    const {
      I18n,
      addTeamMembers,
      editTeam,
      team,
      teamsAdminPath,
      submitButtonLabel,
      modalTitle,
      modalSubtitle
    } = this.props;
    const { description, id, screenName, members } = team;
    return (
      <div>
        <EditTeamModal
          modalTitle={modalTitle}
          modalSubtitle={modalSubtitle}
          submitButtonLabel={submitButtonLabel}
        />
        <Link to={teamsAdminPath} className="team-view-back">
          <SocrataIcon name="arrow-left" className="team-view-back-icon" />
          <span>{I18n.t('users.edit_team.back_to_all_teams')}</span>
        </Link>
        <div className="edit-team-info">
          <h2>
            <span className="team-name">{screenName}</span>
            <span className="team-name-edit" onClick={editTeam}>
              <SocrataIcon name="edit" className="team-edit-icon" />
            </span>
          </h2>
          <div className="team-description">{description}</div>
        </div>
        <div className="team-search-bar search-bar">
          <div> </div>
          <Button variant="primary" onClick={addTeamMembers}>
            {I18n.t('users.edit_team.add_team_members')}
          </Button>
          <AddTeamMembersModal />
        </div>
        <TeamListTable teamId={id} members={members} />
      </div>
    );
  }
}

const mapStateToProps = (state, { I18n, params: { teamId } }) => ({
  modalTitle: I18n.t('users.edit_team.edit_team_title'),
  modalSubtitle: '',
  submitButtonLabel: I18n.t('users.edit_team.edit_team'),
  teamsAdminPath: Selectors.getTeamsAdminPath(state),
  teamId,
  team: Selectors.getTeam(state, teamId) || {}
});

const mapDispatchToProps = (dispatch, { params: { teamId }}) => bindActionCreators({
  addTeamMembers: () => Actions.addTeamMembers(teamId),
  teamViewNavigation: Actions.teamViewNavigation,
  editTeam: () => Actions.editTeam(teamId)
}, dispatch);

export default customConnect({ mapStateToProps, mapDispatchToProps })(TeamView);
