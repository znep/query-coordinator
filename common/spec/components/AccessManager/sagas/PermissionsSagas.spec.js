import { call, put, select } from 'redux-saga/effects';
import { assert } from 'chai';
import { fetchPermissions, savePermissions } from 'common/components/AccessManager/sagas/PermissionsSagas';
import * as selectors from 'common/components/AccessManager/sagas/Selectors';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';
import { permissionsUrl, fetchJsonWithDefaults } from 'common/components/AccessManager/Util';

describe('PermissionsSagas', () => {
  const fakeAssetId = 'fake-uuid';

  const mockPermissions = {
    scope: 'private',
    accessLevels: [
      {
        name: 'viewer',
        version: 'published'
      }
    ],
    users: [
      {
        id: 'cool-cats',
        displayName: 'Fakey',
        email: 'fake@fake.com',
        type: 'user',
        accessLevels: [
          {
            name: 'current_owner',
            version: 'all'
          }
        ]
      }
    ]
  };

  describe('fetchPermissions', () => {
    it('fetches permissions', () => {
      const gen = fetchPermissions();

      assert.deepEqual(
        gen.next().value,
        select(selectors.getAssetUid)
      );

      assert.deepEqual(
        gen.next(fakeAssetId).value,
        call(
          fetchJsonWithDefaults,
          permissionsUrl(fakeAssetId)
        )
      );

      assert.deepEqual(
        gen.next(mockPermissions).value,
        put(permissionsActions.fetchPermissionsSuccess(mockPermissions))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });

    it('catches errors', () => {
      const gen = fetchPermissions();

      assert.deepEqual(
        gen.next().value,
        select(selectors.getAssetUid)
      );

      assert.deepEqual(
        gen.next(fakeAssetId).value,
        call(
          fetchJsonWithDefaults,
          permissionsUrl(fakeAssetId)
        )
      );

      assert.deepEqual(
        gen.throw('error').value,
        put(permissionsActions.fetchPermissionsFail('error'))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });

    it('checks for errors from core', () => {
      const gen = fetchPermissions();

      assert.deepEqual(
        gen.next().value,
        select(selectors.getAssetUid)
      );

      assert.deepEqual(
        gen.next(fakeAssetId).value,
        call(
          fetchJsonWithDefaults,
          permissionsUrl(fakeAssetId)
        )
      );

      const mockResponse = {
        error: true,
        reason: 'Some error'
      };

      // fake getting back the response from the fetch call
      assert.deepEqual(
        gen.next(mockResponse).value,
        put(permissionsActions.fetchPermissionsFail(mockResponse))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });
  });

  describe('savePermissions', () => {
    it('saves permissions', () => {
      const gen = savePermissions();
      assert.deepEqual(
        gen.next().value,
        select(selectors.getAssetUid)
      );

      assert.deepEqual(
        gen.next(fakeAssetId).value,
        select(selectors.getPermissions)
      );

      assert.deepEqual(
        gen.next(mockPermissions).value,
        call(
          fetchJsonWithDefaults,
          permissionsUrl(fakeAssetId),
          {
            method: 'PUT',
            body: JSON.stringify(mockPermissions)
          }
        )
      );

      assert.deepEqual(
        gen.next().value,
        put(permissionsActions.saveSuccess())
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });

    it('catches errors', () => {
      const gen = savePermissions();
      assert.deepEqual(
        gen.next().value,
        select(selectors.getAssetUid)
      );

      assert.deepEqual(
        gen.next(fakeAssetId).value,
        select(selectors.getPermissions)
      );

      assert.deepEqual(
        gen.next(mockPermissions).value,
        call(
          fetchJsonWithDefaults,
          permissionsUrl(fakeAssetId),
          {
            method: 'PUT',
            body: JSON.stringify(mockPermissions)
          }
        )
      );

      assert.deepEqual(
        gen.throw('error').value,
        put(permissionsActions.saveFail('error'))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });
  });
});
