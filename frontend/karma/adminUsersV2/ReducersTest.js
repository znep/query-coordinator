import { expect } from 'chai';
import rootReducer from 'adminUsersV2/reducers';
import * as Selectors from 'adminUsersV2/selectors';

describe('reducers', () => {
  it('should set initial state', () => {
    let state;
    state = rootReducer(undefined, {});
    expect(state).to.eql({
      ui: {
        notificationContent: '',
        notificationType: 'default',
        showAddUsersModal: false,
        addUsersModalDisabled: false,
        showNotification: false,
        submittingUsers: false,
        loadingData: true
      },
      users: {
        addUsersForm: { emails: '', roleId: null, errors: [] },
        filterRoleId: null,
        loadingData: true,
        orderBy: 'screen_name',
        resultCount: 0,
        searchQuery: null,
        searchResultCount: undefined,
        sortDirection: 'ASC',
        users: [],
        zeroBasedPage: 0
      },
      invitedUsers: { invitedUsers: [], loadingData: true },
      roles: {
        loadingData: true,
        roles: [],
        userRoleFilter: undefined
      },
      config: { },
      teams: {
        teams: {
          addMemberErrors: [],
          addMemberSuccesses: [],
          currentTeamId: null,
          offset: 0,
          resultCount: 0,
          teamForm: { id: null, screenName: '', description: '', errors: [] },
          teams: [],
          teamRoles: [],
          userSearch: { currentQuery: '', results: null, selectedUsers: [] }
        },
        ui: {
          disableAddTeamMembersModal: false,
          disableEditTeamModal: false,
          loadingData: true,
          loadingTeam: true,
          loadingError: null,
          loadingTeamRoles: true,
          showEditTeamModal: false,
          showAddTeamMembersModal: false,
          submittingUsers: false
        }
      },
      autocomplete: {
        collapsed: true,
        focusedResult: undefined,
        query: undefined,
        resultsVisible: false,
        searchResults: { resultSetSize: 0, results: [], timings: {} }
      }
    });
  });

  describe('getUsersOffset', () => {
    it('returns offset of 0 for page 1', () => {
      const initialState = {
        config: {
          usersResultsLimit: 10
        },
        users: {
          zeroBasedPage: 0
        }
      };
      const actual = Selectors.getUsersOffset(initialState);
      expect(actual).to.eql(0);
    });
    it('returns offset of 10 for page 2', () => {
      const initialState = {
        config: {
          usersResultsLimit: 10
        },
        users: {
          zeroBasedPage: 1
        }
      };
      const actual = Selectors.getUsersOffset(initialState);
      expect(actual).to.eql(10);
    });
  });
});
