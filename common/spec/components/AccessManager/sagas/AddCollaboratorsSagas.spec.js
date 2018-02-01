import { call, put, select } from 'redux-saga/effects';
import { assert } from 'chai';
import { userAndTeamAutocompleteUrl, fetchJsonWithDefaults } from 'common/components/AccessManager/Util';
import { collaboratorsSearchQueryChanged } from 'common/components/AccessManager/sagas/AddCollaboratorsSagas';
import * as selectors from 'common/components/AccessManager/sagas/Selectors';
import * as addCollaboratorsActions from 'common/components/AccessManager/actions/AddCollaboratorsActions';
import MockUserSearchResults from '../MockUserSearchResults';
import { USER_TYPES } from 'common/components/AccessManager/Constants';

describe('AddCollaboratorsSagas', () => {
  describe('collaboratorsSearchQueryChanged', () => {
    const domain = 'test.test';

    const mockCatalogCall = (gen, query) => {
      // skip delay
      gen.next();

      assert.deepEqual(
        gen.next().value,
        call(
          fetchJsonWithDefaults,
          userAndTeamAutocompleteUrl(query, domain)
        )
      );
    };

    it('handles collaboratorSearchResultsFetchSuccess', () => {
      const query = 'fake';
      const gen = collaboratorsSearchQueryChanged({ query, domain });
      const addedUsers = [
        { email: 'fake0@fake.com' },
        { email: 'fake1@fake.com' }
      ];

      mockCatalogCall(gen, query);

      assert.deepEqual(
        gen.next(MockUserSearchResults).value,
        select(selectors.getAddedUsers)
      );

      const searchResultsWithTypes = {
        ...MockUserSearchResults,
        results: MockUserSearchResults.results.map(r => ({
          ...r,
          user: { ...r.user, type: USER_TYPES.INTERACTIVE }
        }))
      };

      assert.deepEqual(
        gen.next(addedUsers).value,
        put(addCollaboratorsActions.collaboratorsSearchResultsFetchSuccess(searchResultsWithTypes, addedUsers))
      );

      assert.isTrue(gen.next().done);
    });

    it('catches errors', () => {
      const query = 'fake100@fake.com';
      const gen = collaboratorsSearchQueryChanged({ query, domain });

      // skip delay
      gen.next();

      assert.deepEqual(
        gen.next().value,
        call(
          fetchJsonWithDefaults,
          userAndTeamAutocompleteUrl(query, domain)
        )
      );

      assert.deepEqual(
        gen.throw('error').value,
        put(addCollaboratorsActions.collaboratorsSearchResultsFetchFail('error'))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });
  });
});
