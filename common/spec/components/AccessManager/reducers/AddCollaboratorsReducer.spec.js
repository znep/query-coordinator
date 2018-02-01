import { assert, expect } from 'chai';
import { collaboratorsSearchResultsFetchSuccess } from 'common/components/AccessManager/reducers/AddCollaboratorsReducer';
import * as addCollaboratorsActions from 'common/components/AccessManager/actions/AddCollaboratorsActions';

describe('AddCollaboratorsReducer', () => {
  describe('collaboratorsSearchResultsFetchSuccess', () => {
    it('adds an email as a collaborator', () => {
      const results = { results: [] };
      const addedUsers = [];
      const actual = collaboratorsSearchResultsFetchSuccess(
        { selectedUsers: [], query: 'test@example.com' },
        addCollaboratorsActions.collaboratorsSearchResultsFetchSuccess(results, addedUsers)
      );
      assert.deepEqual(actual, {
        selectedUsers: [],
        query: 'test@example.com',
        results: {
          results: [
            {
              user: {
                email: 'test@example.com'
              }
            }
          ]
        }
      });
    });
  });
});
