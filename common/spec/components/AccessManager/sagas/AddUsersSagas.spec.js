import { call, put, select } from 'redux-saga/effects';
import { assert } from 'chai';
import { userAutocompleteUrl, fetchJsonWithDefaults } from 'common/components/AccessManager/Util';
import { userSearchQueryChanged } from 'common/components/AccessManager/sagas/AddUsersSagas';
import * as selectors from 'common/components/AccessManager/sagas/Selectors';
import * as addUsersActions from 'common/components/AccessManager/actions/AddUsersActions';
import MockUserSearchResults from '../MockUserSearchResults';

describe('AddUsersSagas', () => {
  describe('userSearchQueryChanged', () => {
    const domain = 'test.test';

    const mockCatalogCall = (gen, query) => {
      // skip delay
      gen.next();

      assert.deepEqual(
        gen.next().value,
        call(
          fetchJsonWithDefaults,
          userAutocompleteUrl(query, domain)
        )
      );
    };

    it('filters addedUsers', () => {
      const query = 'fake';
      const gen = userSearchQueryChanged({ query, domain });
      const addedUsers = [
        { email: 'fake0@fake.com' },
        { email: 'fake1@fake.com' }
      ];

      mockCatalogCall(gen, query);

      assert.deepEqual(
        gen.next(MockUserSearchResults).value,
        select(selectors.getAddedUsers)
      );

      assert.deepEqual(
        gen.next(addedUsers).value,
        select(selectors.getSelectedUsers)
      );

      const filtered = { ...MockUserSearchResults };
      filtered.results = filtered.results.filter(result => !addedUsers.some(added => added.email === result.user.email));

      assert.deepEqual(
        gen.next([]).value,
        put(addUsersActions.userSearchResultsFetchSuccess(filtered))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });

    it('filters selectedUsers', () => {
      const query = 'fake';
      const gen = userSearchQueryChanged({ query, domain });
      const selectedUsers = [
        { email: 'fake2@fake.com' },
        { email: 'fake3@fake.com' }
      ];

      mockCatalogCall(gen, query);

      assert.deepEqual(
        gen.next(MockUserSearchResults).value,
        select(selectors.getAddedUsers)
      );

      assert.deepEqual(
        gen.next([]).value,
        select(selectors.getSelectedUsers)
      );

      const filtered = { ...MockUserSearchResults };
      filtered.results = filtered.results.filter(result => !selectedUsers.some(added => added.email === result.user.email));

      assert.deepEqual(
        gen.next(selectedUsers).value,
        put(addUsersActions.userSearchResultsFetchSuccess(filtered))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });

    it('adds the query if it is a valid email', () => {
      const query = 'fake100@fake.com';
      const gen = userSearchQueryChanged({ query, domain });

      mockCatalogCall(gen, query);

      assert.deepEqual(
        gen.next(MockUserSearchResults).value,
        select(selectors.getAddedUsers)
      );

      assert.deepEqual(
        gen.next([]).value,
        select(selectors.getSelectedUsers)
      );

      const filtered = { ...MockUserSearchResults };
      filtered.results.push({ user: { email: query } });

      assert.deepEqual(
        gen.next([]).value,
        put(addUsersActions.userSearchResultsFetchSuccess(filtered))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });

    it('catches errors', () => {
      const query = 'fake100@fake.com';
      const gen = userSearchQueryChanged({ query, domain });

      // skip delay
      gen.next();

      assert.deepEqual(
        gen.next().value,
        call(
          fetchJsonWithDefaults,
          userAutocompleteUrl(query, domain)
        )
      );

      assert.deepEqual(
        gen.throw('error').value,
        put(addUsersActions.userSearchResultsFetchFail('error'))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });
  });
});
