import { expect } from 'chai';
import { all, call, cancel, fork, put } from 'redux-saga/effects';
import { cloneableGenerator } from 'redux-saga/utils';
import { createMockTask } from 'redux-saga/utils';
import { browserHistory } from 'react-router';

import * as Sagas from 'adminUsersV2/teams/sagas';
import * as Actions from 'adminUsersV2/teams/actions';
import * as GlobalActions from 'adminUsersV2/actions';
import CoreTeamsApi from 'common/core-teams-api';

describe('teams/sagas', () => {
  describe('loadTeams', () => {
    it('handles success', () => {
      const teams = ['team'];
      const gen = Sagas.loadTeams();
      expect(gen.next().value).to.eql(call(CoreTeamsApi.getAllTeams, 10, 1));
      expect(gen.next(teams).value).to.eql(put(Actions.loadTeamsSuccess(teams)));
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure', () => {
      const error = new Error();
      const gen = Sagas.loadTeams();
      expect(gen.next().value).to.eql(call(CoreTeamsApi.getAllTeams, 10, 1));
      expect(gen.throw(error).value).to.eql(put(Actions.loadTeamsFailure(error)));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('addTeam', () => {
    it('handles successful submit', () => {
      const screenName = 'team name';
      const description = 'team description';
      const id = 'team-idxx';
      const createdTeam = { id };
      const teamViewPath = `/teams/${id}`;
      const gen = Sagas.addTeam();
      expect(gen.next().value).to.eql(put(Actions.showEditTeamModal()));
      gen.next(); // race
      gen.next({ submit: Actions.submitEditTeamModal() }); // getTeamFormName
      gen.next(screenName); // getTeamFormDescription
      expect(gen.next(description).value).to.eql(call(CoreTeamsApi.createTeam, { screenName, description }));
      expect(gen.next(createdTeam).value).to.eql(put(Actions.addTeamSuccess(createdTeam)));
      expect(gen.next().value).to.eql(
        put(
          GlobalActions.showLocalizedSuccessNotification('users.add_new_team.add_team_success_notification')
        )
      );
      gen.next(); // getTeamViewPath
      expect(gen.next(teamViewPath).value).to.eql(call(browserHistory.push, teamViewPath));
      expect(gen.next().value).to.eql(put(Actions.clearTeamFormErrors()));
      expect(gen.next().value).to.eql(put(Actions.hideEditTeamModal()));
      expect(gen.next().done).to.eql(true);
    });
    it('handles cancel', () => {
      const gen = Sagas.addTeam();
      expect(gen.next().value).to.eql(put(Actions.showEditTeamModal()));
      gen.next(); // race
      expect(gen.next({ cancel: Actions.cancelEditTeamModal() }).value).to.eql(
        put(Actions.clearTeamFormErrors())
      );
      expect(gen.next().value).to.eql(put(Actions.hideEditTeamModal()));
      expect(gen.next().done).to.eql(true);
    });
    it('handles failed submit', () => {
      const error = new Error();
      const screenName = 'team name';
      const description = 'team description';
      const gen = Sagas.addTeam();
      expect(gen.next().value).to.eql(put(Actions.showEditTeamModal()));
      gen.next(); // race
      gen.next({ submit: Actions.submitEditTeamModal() }); // getTeamFormName
      gen.next(screenName); // getTeamFormDescription
      expect(gen.next(description).value).to.eql(call(CoreTeamsApi.createTeam, { screenName, description }));
      expect(gen.throw(error).value).to.eql(put(Actions.addTeamFailure(error)));
      expect(gen.next().value).to.eql(put(Actions.clearTeamFormErrors()));
      expect(gen.next().value).to.eql(put(Actions.hideEditTeamModal()));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('addTeamMembers', () => {
    it('handles cancel', () => {
      const teamId = 'team-idxx';
      const gen = Sagas.addTeamMembers(Actions.addTeamMembers(teamId));
      expect(gen.next().value).to.eql(put(Actions.showAddTeamMembersModal()));
      expect(gen.next().value).to.eql(put(Actions.enableAddTeamMembersModal()));
      expect(gen.next().value).to.eql(fork(Sagas.watchUserSearchQueryChanged));
      const userSearchTask = createMockTask();
      gen.next(userSearchTask); // race
      expect(gen.next({ cancelModal: Actions.cancelAddTeamMembersModal() }).value).to.eql(
        cancel(userSearchTask)
      );
      expect(gen.next().value).to.eql(put(Actions.hideAddTeamMembersModal()));
      expect(gen.next().done).to.eql(true);
    });
    it('handles submit success', () => {
      const teamId = 'team-idxx';
      const gen = Sagas.addTeamMembers(Actions.addTeamMembers(teamId));
      expect(gen.next().value).to.eql(put(Actions.showAddTeamMembersModal()));
      expect(gen.next().value).to.eql(put(Actions.enableAddTeamMembersModal()));
      expect(gen.next().value).to.eql(fork(Sagas.watchUserSearchQueryChanged));
      const userSearchTask = createMockTask();
      gen.next(userSearchTask); // race
      expect(gen.next({ submit: Actions.submitAddTeamMembersModal() }).value).to.eql(cancel(userSearchTask));
      expect(gen.next().value).to.eql(put(Actions.disableAddTeamMembersModal()));
      gen.next(); // delay
      gen.next(); // select roleId
      const roleId = 'member';
      gen.next(roleId); // select users
      const userId = 'user-idxx';
      const selectedUsers = [{ id: userId }];
      expect(gen.next(selectedUsers).value).to.eql(
        all([call(Sagas.fetchAddTeamMember, teamId, userId, roleId)])
      );
      expect(gen.next().value).to.eql(
        all([
          put(Actions.addTeamMemberSuccess(teamId, { displayName: undefined, id: userId, teamRole: roleId }))
        ])
      );
      expect(gen.next().value).to.eql(
        put(GlobalActions.showLocalizedSuccessNotification('users.edit_team.add_team_members_success'))
      );
      expect(gen.next().value).to.eql(put(Actions.hideAddTeamMembersModal()));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('changeMemberRole', () => {
    it('handles success', () => {
      const teamId = 'team-idxx';
      const userId = 'user-idxx';
      const roleId = 'member';
      const gen = Sagas.changeMemberRole(Actions.changeMemberRole(teamId, userId, roleId));
      expect(gen.next().value).to.eql(call(CoreTeamsApi.updateTeamMember, teamId, userId, roleId));
      expect(gen.next().value).to.eql(put(Actions.changeMemberRoleSuccess(teamId, userId, roleId)));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('deleteTeam', () => {
    it('handles success', () => {
      const id = 'team-idxx';
      const gen = Sagas.deleteTeam(Actions.deleteTeam(id));
      expect(gen.next().value).to.eql(call(CoreTeamsApi.deleteTeam, id));
      expect(gen.next().value).to.eql(put(Actions.deleteTeamSuccess(id)));
      expect(gen.next().value).to.eql(
        put(GlobalActions.showLocalizedSuccessNotification('users.notifications.delete_team_success'))
      );
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure', () => {
      const error = new Error();
      const id = 'team-idxx';
      const gen = Sagas.deleteTeam(Actions.deleteTeam(id));
      expect(gen.next().value).to.eql(call(CoreTeamsApi.deleteTeam, id));
      expect(gen.throw(error).value).to.eql(put(Actions.deleteTeamFailure(error)));
      expect(gen.next().value).to.eql(
        put(GlobalActions.showLocalizedErrorNotification('users.errors.server_error_html'))
      );
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('editTeam', () => {});
  describe('loadTeam', () => {
    it('handles success', () => {
      const id = 'team-idxx';
      const team = 'team';
      const gen = Sagas.loadTeam(Actions.loadTeam(id));
      expect(gen.next().value).to.eql(call(CoreTeamsApi.getTeam, id));
      expect(gen.next(team).value).to.eql(put(Actions.loadTeamSuccess(team)));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('loadTeamRoles', () => {
    it('handles success', () => {
      const roles = ['role'];
      const gen = Sagas.loadTeamRoles();
      expect(gen.next().value).to.eql(call(CoreTeamsApi.getRoles));
      expect(gen.next(roles).value).to.eql(put(Actions.loadTeamRolesSuccess(roles)));
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure', () => {
      const error = new Error();
      const gen = Sagas.loadTeamRoles();
      expect(gen.next().value).to.eql(call(CoreTeamsApi.getRoles));
      expect(gen.throw(error).value).to.eql(put(Actions.loadTeamRolesFailure(error)));
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('removeTeamMember', () => {
    it('handles success', () => {
      const teamId = 'team-idxx';
      const userId = 'user-idxx';
      const displayName = 'team member';
      const teamMember = { displayName };
      const gen = Sagas.removeTeamMember(Actions.removeTeamMember(teamId, userId));
      gen.next(); // select teamMember
      expect(gen.next(teamMember).value).to.eql(call(CoreTeamsApi.removeTeamMember, teamId, userId));
      expect(gen.next().value).to.eql(put(Actions.removeTeamMemberSuccess(teamId, userId)));
      expect(gen.next().value).to.eql(
        put(
          GlobalActions.showLocalizedSuccessNotification('users.edit_team.remove_team_member_success', {
            displayName
          })
        )
      );
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure', () => {
      const error = new Error();
      const teamId = 'team-idxx';
      const userId = 'user-idxx';
      const displayName = 'team member';
      const teamMember = { displayName };
      const gen = Sagas.removeTeamMember(Actions.removeTeamMember(teamId, userId));
      gen.next(); // select teamMember
      expect(gen.next(teamMember).value).to.eql(call(CoreTeamsApi.removeTeamMember, teamId, userId));
      expect(gen.throw(error).value).to.eql(
        put(
          GlobalActions.showLocalizedErrorNotification('users.edit_team.remove_team_member_failure', {
            displayName
          })
        )
      );
      expect(gen.next().done).to.eql(true);
    });
  });
  describe('teamViewNavigation', () => {
    it('handles success', () => {
      const id = 'team-idxx';
      const action = Actions.teamViewNavigation(id);
      const gen = Sagas.teamViewNavigation(Actions.teamViewNavigation(id));
      expect(gen.next().value).to.eql(call(Sagas.loadTeam, action));
      expect(gen.next().done).to.eql(true);
    });
    it('handles failure', () => {
      const error = new Error();
      const teamsAdminPath = '/teams';
      const id = 'team-idxx';
      const action = Actions.teamViewNavigation(id);
      const gen = Sagas.teamViewNavigation(Actions.teamViewNavigation(id));
      expect(gen.next().value).to.eql(call(Sagas.loadTeam, action));
      gen.throw(error); // getTeamsAdminPath
      expect(gen.next(teamsAdminPath).value).to.eql(call(browserHistory.push, teamsAdminPath));
    });
  });
  describe('handleTeamModal', () => {
    const baseGen = cloneableGenerator(Sagas.handleTeamModal)();
    baseGen.next(); // race
    describe('submitting', () => {
      const returnValue = { submit: Actions.submitEditTeamModal() };
      const submitGen = baseGen.clone();
      it('handles submit', () => {
        expect(submitGen.next(returnValue).value).to.eql(put(Actions.disableEditTeamModal()));
        submitGen.next(); // delay
        submitGen.next(); // get team form name
      });
      const goodScreenName = 'team name';
      const badScreenName = '';
      it('returns on successful validation', () => {
        const gen = submitGen.clone();
        expect(gen.next(goodScreenName).value).to.eql(returnValue);
        expect(gen.next().done).to.eql(true);
      });
      it('loops on failed validation', () => {
        const gen = submitGen.clone();
        expect(gen.next(badScreenName).value).to.eql(
          put(Actions.setTeamFormErrors([{ translationKey: 'users.errors.no_team_name_provided' }]))
        );
        expect(gen.next().value).to.eql(put(Actions.enableEditTeamModal()));
        // loop
        expect(gen.next().value).to.have.any.keys('RACE');
        expect(gen.next(returnValue).value).to.eql(put(Actions.disableEditTeamModal()));
        gen.next(); // delay
        gen.next(); // get team form name
        expect(gen.next(goodScreenName).value).to.eql(returnValue);
        expect(gen.next().done).to.eql(true);
      });
    });
    it('handles cancel', () => {
      const gen = baseGen.clone();
      const returnValue = { cancel: Actions.cancelEditTeamModal() };
      expect(gen.next(returnValue).value).to.eql(put(Actions.disableEditTeamModal()));
      expect(gen.next().value).to.eql(put(Actions.hideEditTeamModal()));
      expect(gen.next().value).to.eql(returnValue); // return value
      expect(gen.next().done).to.eql(true);
    });
  });
});
