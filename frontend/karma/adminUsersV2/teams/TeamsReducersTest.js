import { expect } from 'chai';

import * as Actions from 'adminUsersV2/teams/actions';
import reducer, { initialState } from 'adminUsersV2/teams/reducers/teamsReducer';

describe('teams/reducers/teamsReducer', () => {
  it('reduces initial state', () => {
    expect(reducer(undefined, {})).to.eql(initialState);
  });

  it('handles ADD_TEAM', () => {
    expect(reducer({}, Actions.addTeam())).to.eql({
      teamForm: { ...initialState.teamForm }
    });
  });
  it('handles LOAD_TEAMS_SUCCESS', () => {
    const teams = ['team'];
    expect(reducer({}, Actions.loadTeamsSuccess(teams))).to.eql({
      teams
    });
  });
  it('handles LOAD_TEAM_ROLES_SUCCESS', () => {
    const teamRoles = ['role'];
    expect(reducer({}, Actions.loadTeamRolesSuccess(teamRoles))).to.eql({
      teamRoles
    });
  });
  it('handles ADD_TEAM_SUCCESS', () => {
    const team = 'team';
    expect(reducer({ teams: [] }, Actions.addTeamSuccess(team))).to.eql({
      teamForm: { ...initialState.teamForm },
      teams: [team]
    });
  });
  it('handles EDIT_TEAM_SUCCESS', () => {
    const id = 'team-idxx';
    const screenName = 'team name';
    const description = 'team description';
    expect(
      reducer(
        {
          teamForm: { screenName, description },
          teams: [{ id, screenName: 'foo', description: 'bar', members: [] }, { id: 'team-idzz' }]
        },
        Actions.editTeamSuccess({ id })
      )
    ).to.eql({
      teamForm: { ...initialState.teamForm },
      teams: [
        {
          id,
          screenName,
          description,
          members: []
        },
        { id: 'team-idzz' }
      ]
    });
  });
  it('handles SET_TEAM_FORM_ERRORS', () => {
    const errors = ['error'];
    expect(reducer({ teamForm: { screenName: 'test' } }, Actions.setTeamFormErrors(errors))).to.eql({
      teamForm: { screenName: 'test', errors }
    });
  });
  it('handles SET_TEAM_FORM', () => {
    const id = 'team-idxx';
    const screenName = 'team name';
    const description = 'team description';
    expect(reducer({ teamForm: {} }, Actions.setTeamForm(id, screenName, description))).to.eql({
      teamForm: { id, screenName, description, errors: [] }
    });
  });
  it('handles ADD_TEAM_MEMBER_SUCCESS', () => {
    const teamId = 'team-idxx';
    const newMember = { id: 'user-idxx', screeName: 'user' };
    expect(
      reducer(
        {
          addMemberSuccesses: [],
          userSearch: { selectedUsers: [{ id: 'user-idxx' }] },
          teams: [{ id: 'team-idxx', members: [] }]
        },
        Actions.addTeamMemberSuccess(teamId, newMember)
      )
    ).to.eql({
      addMemberSuccesses: [newMember],
      userSearch: { selectedUsers: [] },
      teams: [{ id: 'team-idxx', members: [newMember] }]
    });
  });
  it('handles ADD_TEAM_MEMBER_FAILURE', () => {
    const error = new Error();
    expect(reducer({ addMemberErrors: [] }, Actions.addTeamMemberFailure(error))).to.eql({
      addMemberErrors: [error]
    });
  });
  it('handles REMOVE_TEAM_MEMBER_SUCCESS', () => {
    const teamId = 'team-idxx';
    const userId = 'user-idxx';
    expect(
      reducer(
        {
          teams: [{ id: teamId, members: [{ id: userId }, { id: 'user-idzz' }] }]
        },
        Actions.removeTeamMemberSuccess(teamId, userId)
      )
    ).to.eql({
      teams: [{ id: teamId, members: [{ id: 'user-idzz' }] }]
    });
  });
  it('handles CHANGE_MEMBER_ROLE_SUCCESS', () => {
    const teamId = 'team-idxx';
    const userId = 'user-idxx';
    const roleId = 'member';
    expect(
      reducer(
        { teams: [{ id: teamId, members: [{ id: userId, teamRole: 'foo' }] }] },
        Actions.changeMemberRoleSuccess(teamId, userId, roleId)
      )
    ).to.eql({
      teams: [{ id: teamId, members: [{ id: userId, teamRole: 'member' }] }]
    });
  });
  it('handles LOAD_TEAM_SUCCESS', () => {
    const id = 'team-idxx';
    const team = { id, screeName: 'team name' };
    expect(reducer({ teams: [{ id }] }, Actions.loadTeamSuccess(team))).to.eql({
      teams: [team]
    });
  });
  it('handles UPDATE_TEAM_FORM for creating new team', () => {
    const screenName = 'team name';
    const description = 'team description';
    expect(reducer({ teamForm: {} }, Actions.updateTeamForm(screenName, description))).to.eql({
      teamForm: { id: undefined, screenName, description, errors: [] }
    });
  });
  it('handles UPDATE_TEAM_FORM for editing team', () => {
    const screenName = 'team name';
    const description = 'team description';
    expect(reducer({ teamForm: { id: 'team-idxxx', screenName: 'blah', description: 'bloop' } }, Actions.updateTeamForm(screenName, description))).to.eql({
      teamForm: { id: 'team-idxxx', screenName, description, errors: [] }
    });
  });
  it('handles TEAM_VIEW_NAVIGATION', () => {
    const id = 'team-idxx';
    expect(reducer({ currentTeamId: 'foo' }, Actions.teamViewNavigation(id))).to.eql({
      currentTeamId: id
    });
  });
  it('handles USER_SEARCH_QUERY_CHANGED', () => {
    const currentQuery = 'query';
    expect(
      reducer(
        {
          userSearch: {
            currentQuery: 'foo'
          }
        },
        Actions.userSearchQueryChanged(currentQuery)
      )
    ).to.eql({
      addMemberErrors: [],
      addMemberSuccesses: [],
      userSearch: { currentQuery }
    });
  });
  it('handles USER_SEARCH_RESULTS', () => {
    const results = [
      {
        user: {
          id: 'quh2-cr3g',
          screen_name: 'superuser superuser',
          email: 'engineering@socrata.com',
          role_name: 'designer',
          role_id: 2,
          flags: ['admin']
        },
        title: 'superuser superuser'
      }
    ];
    const state = reducer(
      {
        addMemberErrors: [],
        addMemberSuccesses: [],
        currentTeamId: 'hefh-k2pa',
        offset: 0,
        resultCount: 0,
        teamForm: { id: null, screenName: '', description: '', errors: [] },
        teams: [
          {
            id: 'hefh-k2pa',
            createdAt: 1515775932,
            displayName: 'My new team',
            screenName: 'My new team',
            type: 'team',
            members: [
              {
                id: 'vkji-3zrf',
                createdAt: 1485473947,
                displayName: 'Ragan Webber',
                screenName: 'Ragan Webber',
                teamId: 13,
                teamRole: 'owner',
                type: 'interactive'
              }
            ]
          }
        ],
        teamRoles: ['member', 'owner'],
        userSearch: {
          currentQuery: '',
          results: null,
          selectedUsers: [
            {
              id: 'quh2-cr3g',
              screen_name: 'superuser superuser',
              email: 'engineering@socrata.com',
              role_name: 'designer',
              role_id: 2,
              flags: ['admin']
            }
          ]
        }
      },
      Actions.userSearchResults(results)
    );
    expect(state).to.eql({
      addMemberErrors: [],
      addMemberSuccesses: [],
      currentTeamId: 'hefh-k2pa',
      offset: 0,
      resultCount: 0,
      teamForm: { id: null, screenName: '', description: '', errors: [] },
      teams: [
        {
          id: 'hefh-k2pa',
          createdAt: 1515775932,
          displayName: 'My new team',
          screenName: 'My new team',
          type: 'team',
          members: [
            {
              id: 'vkji-3zrf',
              createdAt: 1485473947,
              displayName: 'Ragan Webber',
              screenName: 'Ragan Webber',
              teamId: 13,
              teamRole: 'owner',
              type: 'interactive'
            }
          ]
        }
      ],
      teamRoles: ['member', 'owner'],
      userSearch: {
        currentQuery: '',
        results: [],
        selectedUsers: [
          {
            id: 'quh2-cr3g',
            screen_name: 'superuser superuser',
            email: 'engineering@socrata.com',
            role_name: 'designer',
            role_id: 2,
            flags: ['admin']
          }
        ]
      }
    });
  });
  it('handles USER_SEARCH_ADD_SELECTED_USER', () => {
    const user = {
      id: 'quh2-cr3g',
      screen_name: 'superuser superuser',
      email: 'engineering@socrata.com',
      role_name: 'designer',
      role_id: 2,
      flags: ['admin']
    };
    const state = reducer(
      {
        addMemberErrors: [],
        addMemberSuccesses: [],
        currentTeamId: 'hefh-k2pa',
        offset: 0,
        resultCount: 0,
        teamForm: { id: null, screenName: '', description: '', errors: [] },
        teams: [
          {
            id: 'hefh-k2pa',
            createdAt: 1515775932,
            displayName: 'My new team',
            screenName: 'My new team',
            type: 'team',
            members: [
              {
                id: 'vkji-3zrf',
                createdAt: 1485473947,
                displayName: 'Ragan Webber',
                screenName: 'Ragan Webber',
                teamId: 13,
                teamRole: 'owner',
                type: 'interactive'
              }
            ]
          }
        ],
        teamRoles: ['member', 'owner'],
        userSearch: {
          currentQuery: '',
          results: null,
          selectedUsers: [
            {
              id: 'quh2-cr3g',
              screen_name: 'superuser superuser',
              email: 'engineering@socrata.com',
              role_name: 'designer',
              role_id: 2,
              flags: ['admin']
            }
          ]
        }
      },
      Actions.userSearchAddSelectedUser(user)
    );
    expect(state).to.eql({
      addMemberErrors: [],
      addMemberSuccesses: [],
      currentTeamId: 'hefh-k2pa',
      offset: 0,
      resultCount: 0,
      teamForm: { id: null, screenName: '', description: '', errors: [] },
      teams: [
        {
          id: 'hefh-k2pa',
          createdAt: 1515775932,
          displayName: 'My new team',
          screenName: 'My new team',
          type: 'team',
          members: [
            {
              id: 'vkji-3zrf',
              createdAt: 1485473947,
              displayName: 'Ragan Webber',
              screenName: 'Ragan Webber',
              teamId: 13,
              teamRole: 'owner',
              type: 'interactive'
            }
          ]
        }
      ],
      teamRoles: ['member', 'owner'],
      userSearch: {
        currentQuery: '',
        results: null,
        selectedUsers: [
          {
            id: 'quh2-cr3g',
            screen_name: 'superuser superuser',
            email: 'engineering@socrata.com',
            role_name: 'designer',
            role_id: 2,
            flags: ['admin']
          }
        ]
      }
    });
  });
  it('handles USER_SEARCH_REMOVE_SELECTED_USER', () => {
    const user = {
      id: 'quh2-cr3g',
      screen_name: 'superuser superuser',
      email: 'engineering@socrata.com',
      role_name: 'designer',
      role_id: 2,
      flags: ['admin']
    };
    const state = reducer(
      {
        addMemberErrors: [],
        addMemberSuccesses: [],
        currentTeamId: 'hefh-k2pa',
        offset: 0,
        resultCount: 0,
        teamForm: { id: null, screenName: '', description: '', errors: [] },
        teams: [
          {
            id: 'hefh-k2pa',
            createdAt: 1515775932,
            displayName: 'My new team',
            screenName: 'My new team',
            type: 'team',
            members: [
              {
                id: 'vkji-3zrf',
                createdAt: 1485473947,
                displayName: 'Ragan Webber',
                screenName: 'Ragan Webber',
                teamId: 13,
                teamRole: 'owner',
                type: 'interactive'
              }
            ]
          }
        ],
        teamRoles: ['member', 'owner'],
        userSearch: {
          currentQuery: '',
          results: null,
          selectedUsers: [
            {
              id: 'quh2-cr3g',
              screen_name: 'superuser superuser',
              email: 'engineering@socrata.com',
              role_name: 'designer',
              role_id: 2,
              flags: ['admin']
            }
          ]
        }
      },
      Actions.userSearchRemoveSelectedUser(user)
    );
    expect(state).to.eql({
      addMemberErrors: [],
      addMemberSuccesses: [],
      currentTeamId: 'hefh-k2pa',
      offset: 0,
      resultCount: 0,
      teamForm: { id: null, screenName: '', description: '', errors: [] },
      teams: [
        {
          id: 'hefh-k2pa',
          createdAt: 1515775932,
          displayName: 'My new team',
          screenName: 'My new team',
          type: 'team',
          members: [
            {
              id: 'vkji-3zrf',
              createdAt: 1485473947,
              displayName: 'Ragan Webber',
              screenName: 'Ragan Webber',
              teamId: 13,
              teamRole: 'owner',
              type: 'interactive'
            }
          ]
        }
      ],
      teamRoles: ['member', 'owner'],
      userSearch: {
        currentQuery: '',
        results: null,
        selectedUsers: []
      }
    });
  });
  it('handles SUBMIT_ADD_TEAM_MEMBERS_MODAL', () => {
    expect(
      reducer(
        {
          addMemberErrors: ['error'],
          addMemberSuccesses: ['success']
        },
        Actions.submitAddTeamMembersModal()
      )
    ).to.eql({
      addMemberSuccesses: [],
      addMemberErrors: []
    });
  });
  it('handles CANCEL_ADD_TEAM_MEMBERS_MODAL', () => {
    expect(
      reducer(
        {
          userSearch: { currentQuery: 'query', results: ['result'], selectedUsers: ['user'] },
          addMemberErrors: ['error'],
          addMemberSuccesses: ['success']
        },
        Actions.cancelAddTeamMembersModal()
      )
    ).to.eql({
      userSearch: { ...initialState.userSearch },
      addMemberErrors: [],
      addMemberSuccesses: []
    });
  });
});
