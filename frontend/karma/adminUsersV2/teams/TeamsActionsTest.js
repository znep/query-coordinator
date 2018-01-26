import { expect } from 'chai';

import * as Actions from 'adminUsersV2/teams/actions';

describe('teams/actions', () => {
  describe('creates an action to', () => {
    it('load teams', () => {
      expect(Actions.loadTeams()).to.eql({
        type: Actions.LOAD_TEAMS
      });
    });
    it('load teams success', () => {
      const teams = ['team'];
      expect(Actions.loadTeamsSuccess(teams)).to.eql({
        type: Actions.LOAD_TEAMS_SUCCESS,
        payload: { teams }
      });
    });
    it('load teams failure', () => {
      const error = new Error();
      expect(Actions.loadTeamsFailure(error)).to.eql({
        type: Actions.LOAD_TEAMS_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('load team roles', () => {
      expect(Actions.loadTeamRoles()).to.eql({
        type: Actions.LOAD_TEAM_ROLES
      });
    });
    it('load team roles success', () => {
      const teamRoles = 'team roles';
      expect(Actions.loadTeamRolesSuccess(teamRoles)).to.eql({
        type: Actions.LOAD_TEAM_ROLES_SUCCESS,
        payload: { teamRoles }
      });
    });
    it('load team roles failure', () => {
      const error = new Error();
      expect(Actions.loadTeamRolesFailure(error)).to.eql({
        type: Actions.LOAD_TEAM_ROLES_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('delete team', () => {
      const id = 'team-idxx';
      expect(Actions.deleteTeam(id)).to.eql({
        type: Actions.DELETE_TEAM,
        payload: { id }
      });
    });
    it('delete team success', () => {
      const id = 'team-idxx';
      expect(Actions.deleteTeamSuccess(id)).to.eql({
        type: Actions.DELETE_TEAM_SUCCESS,
        payload: { id }
      });
    });
    it('delete team failure', () => {
      const error = new Error();
      expect(Actions.deleteTeamFailure(error)).to.eql({
        type: Actions.DELETE_TEAM_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('edit team', () => {
      const id = 'team-idxx';
      expect(Actions.editTeam(id)).to.eql({
        type: Actions.EDIT_TEAM,
        payload: { id }
      });
    });
    it('edit team success', () => {
      const team = 'team';
      expect(Actions.editTeamSuccess(team)).to.eql({
        type: Actions.EDIT_TEAM_SUCCESS,
        payload: { team }
      });
    });
    it('edit team failure', () => {
      const error = new Error();
      expect(Actions.editTeamFailure(error)).to.eql({
        type: Actions.EDIT_TEAM_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('add team', () => {
      expect(Actions.addTeam()).to.eql({
        type: Actions.ADD_TEAM
      });
    });
    it('add team success', () => {
      const team = 'team';
      expect(Actions.addTeamSuccess(team)).to.eql({
        type: Actions.ADD_TEAM_SUCCESS,
        payload: { team }
      });
    });
    it('add team failure', () => {
      const error = new Error();
      expect(Actions.addTeamFailure(error)).to.eql({
        type: Actions.ADD_TEAM_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('show edit team modal', () => {
      expect(Actions.showEditTeamModal()).to.eql({
        type: Actions.SHOW_EDIT_TEAM_MODAL
      });
    });
    it('hide edit team modal', () => {
      expect(Actions.hideEditTeamModal()).to.eql({
        type: Actions.HIDE_EDIT_TEAM_MODAL
      });
    });
    it('enable edit team modal', () => {
      expect(Actions.enableEditTeamModal()).to.eql({
        type: Actions.ENABLE_EDIT_TEAM_MODAL
      });
    });
    it('cancel edit team modal', () => {
      expect(Actions.cancelEditTeamModal()).to.eql({
        type: Actions.CANCEL_EDIT_TEAM_MODAL
      });
    });
    it('submit edit team modal', () => {
      expect(Actions.submitEditTeamModal()).to.eql({
        type: Actions.SUBMIT_EDIT_TEAM_MODAL
      });
    });
    it('set team form errors', () => {
      const errors = ['error'];
      expect(Actions.setTeamFormErrors(errors)).to.eql({
        type: Actions.SET_TEAM_FORM_ERRORS,
        payload: { errors }
      });
    });
    it('clear team form errors', () => {
      const errors = [];
      expect(Actions.clearTeamFormErrors()).to.eql({
        type: Actions.SET_TEAM_FORM_ERRORS,
        payload: { errors }
      });
    });
    it('set team form', () => {
      const id = 'team-idxx';
      const screenName = 'team name';
      const description = 'team description';

      expect(Actions.setTeamForm(id, screenName, description)).to.eql({
        type: Actions.SET_TEAM_FORM,
        payload: { id, screenName, description }
      });
    });
    it('add team members', () => {
      const teamId = 'team-idxx';
      expect(Actions.addTeamMembers(teamId)).to.eql({
        type: Actions.ADD_TEAM_MEMBERS,
        payload: { teamId }
      });
    });
    it('add team member success', () => {
      const teamId = 'team-idxx';
      const newMember = 'member';
      expect(Actions.addTeamMemberSuccess(teamId, newMember)).to.eql({
        type: Actions.ADD_TEAM_MEMBER_SUCCESS,
        payload: { teamId, newMember }
      });
    });
    it('add team member failure', () => {
      const error = new Error();
      expect(Actions.addTeamMemberFailure(error)).to.eql({
        type: Actions.ADD_TEAM_MEMBER_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('show add team members modal', () => {
      expect(Actions.showAddTeamMembersModal()).to.eql({
        type: Actions.SHOW_ADD_TEAM_MEMBERS_MODAL
      });
    });
    it('hide add team members modal', () => {
      expect(Actions.hideAddTeamMembersModal()).to.eql({
        type: Actions.HIDE_ADD_TEAM_MEMBERS_MODAL
      });
    });
    it('disable add team members modal', () => {
      expect(Actions.disableAddTeamMembersModal()).to.eql({
        type: Actions.DISABLE_ADD_TEAM_MEMBERS_MODAL
      });
    });
    it('enable add team members modal', () => {
      expect(Actions.enableAddTeamMembersModal()).to.eql({
        type: Actions.ENABLE_ADD_TEAM_MEMBERS_MODAL
      });
    });
    it('cancel add team members modal', () => {
      expect(Actions.cancelAddTeamMembersModal()).to.eql({
        type: Actions.CANCEL_ADD_TEAM_MEMBERS_MODAL
      });
    });
    it('submit add team members modal', () => {
      expect(Actions.submitAddTeamMembersModal()).to.eql({
        type: Actions.SUBMIT_ADD_TEAM_MEMBERS_MODAL
      });
    });
    it('update team form', () => {
      const screenName = 'team name';
      const description = 'team description';
      expect(Actions.updateTeamForm(screenName, description)).to.eql({
        type: Actions.UPDATE_TEAM_FORM,
        payload: { screenName, description }
      });
    });
    it('load team', () => {
      const id = 'team-idxx';
      expect(Actions.loadTeam(id)).to.eql({
        type: Actions.LOAD_TEAM,
        payload: { id }
      });
    });
    it('load team success', () => {
      const team = 'team';
      expect(Actions.loadTeamSuccess(team)).to.eql({
        type: Actions.LOAD_TEAM_SUCCESS,
        payload: { team }
      });
    });
    it('load team failure', () => {
      const error = new Error();
      expect(Actions.loadTeamFailure(error)).to.eql({
        type: Actions.LOAD_TEAM_FAILURE,
        error: true,
        payload: { error }
      });
    });
    it('remove team member', () => {
      const teamId = 'team-idxx';
      const userId = 'user-idxx';
      expect(Actions.removeTeamMember(teamId, userId)).to.eql({
        type: Actions.REMOVE_TEAM_MEMBER,
        payload: { teamId, userId }
      });
    });
    it('remove team member success', () => {
      const teamId = 'team-idxx';
      const userId = 'user-idxx';
      expect(Actions.removeTeamMemberSuccess(teamId, userId)).to.eql({
        type: Actions.REMOVE_TEAM_MEMBER_SUCCESS,
        payload: { teamId, userId }
      });
    });
    it('change member role', () => {
      const teamId = 'team-idxx';
      const userId = 'user-idxx';
      const roleId = 'role-idxx';
      expect(Actions.changeMemberRole(teamId, userId, roleId)).to.eql({
        type: Actions.CHANGE_MEMBER_ROLE,
        payload: { teamId, userId, roleId }
      });
    });
    it('change member role success', () => {
      const teamId = 'team-idxx';
      const userId = 'user-idxx';
      const roleId = 'role-idxx';
      expect(Actions.changeMemberRoleSuccess(teamId, userId, roleId)).to.eql({
        type: Actions.CHANGE_MEMBER_ROLE_SUCCESS,
        payload: { teamId, userId, roleId }
      });
    });
    it('user search add selected user', () => {
      const result = { user: 'user' };
      expect(Actions.userSearchAddSelectedUser(result)).to.eql({
        type: Actions.USER_SEARCH_ADD_SELECTED_USER,
        payload: { user: 'user' }
      });
    });
    it('user search remove selected user', () => {
      const user = 'user';
      expect(Actions.userSearchRemoveSelectedUser(user)).to.eql({
        type: Actions.USER_SEARCH_REMOVE_SELECTED_USER,
        payload: { user }
      });
    });
    it('user search query changed', () => {
      const currentQuery = 'query';
      expect(Actions.userSearchQueryChanged(currentQuery)).to.eql({
        type: Actions.USER_SEARCH_QUERY_CHANGED,
        payload: { currentQuery }
      });
    });
    it('user search results', () => {
      const results = 'results';
      expect(Actions.userSearchResults(results)).to.eql({
        type: Actions.USER_SEARCH_RESULTS,
        payload: { results }
      });
    });
    it('team view navigation', () => {
      const id = 'team-idxx';
      expect(Actions.teamViewNavigation(id)).to.eql({
        type: Actions.TEAM_VIEW_NAVIGATION,
        payload: { id }
      });
    });
  });
});
