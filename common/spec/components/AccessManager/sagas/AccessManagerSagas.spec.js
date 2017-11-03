import { call, put, select } from 'redux-saga/effects';
import { assert } from 'chai';
import { fetchPermissions, savePermissions } from 'common/components/AccessManager/sagas/AccessManagerSagas';
import * as selectors from 'common/components/AccessManager/sagas/Selectors';
import * as actions from 'common/components/AccessManager/actions/AccessManagerActions';

describe('AccessManagerSagas', () => {
  const fakeAssetId = 'fake-uuid';

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
          fetch,
          `/api/views/${fakeAssetId}/permissions`,
          {
            credentials: 'same-origin'
          }
        )
      );

      const mockResponse = [
        {
          'public': true,
          type: 'read'
        }
      ];

      // fake getting back the response from the fetch call
      gen.next(new Response(JSON.stringify(mockResponse)));

      assert.deepEqual(
        gen.next(mockResponse).value,
        put(actions.fetchPermissionsSuccess(mockResponse))
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
          fetch,
          `/api/views/${fakeAssetId}/permissions`,
          {
            credentials: 'same-origin'
          }
        )
      );

      assert.deepEqual(
        gen.throw('error').value,
        put(actions.fetchPermissionsFail('error'))
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
          fetch,
          `/api/views/${fakeAssetId}/permissions`,
          {
            credentials: 'same-origin'
          }
        )
      );

      const mockResponse = {
        error: true,
        reason: 'Some error'
      };

      // fake getting back the response from the fetch call
      gen.next(new Response(JSON.stringify(mockResponse)));

      assert.deepEqual(
        gen.next(mockResponse).value,
        put(actions.fetchPermissionsFail(mockResponse))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });
  });

  describe('savePermissions', () => {
    const fakePublicPermissions = [
      {
        'public': true,
        type: 'read'
      }
    ];

    const fakePrivatePermissions = [];

    it('saves public permissions', () => {
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
        gen.next(fakePublicPermissions).value,
        call(
          fetch,
          `/api/views/${fakeAssetId}?accessType=WEBSITE&method=setPermission&value=public.read`,
          {
            method: 'PUT',
            credentials: 'same-origin'
          }
        )
      );

      assert.deepEqual(
        gen.next(new Response()).value,
        put(actions.saveSuccess())
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });

    it('saves private permissions', () => {
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
        gen.next(fakePrivatePermissions).value,
        call(
          fetch,
          `/api/views/${fakeAssetId}?accessType=WEBSITE&method=setPermission&value=private`,
          {
            method: 'PUT',
            credentials: 'same-origin'
          }
        )
      );

      assert.deepEqual(
        gen.next(new Response()).value,
        put(actions.saveSuccess())
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
        gen.next(fakePrivatePermissions).value,
        call(
          fetch,
          `/api/views/${fakeAssetId}?accessType=WEBSITE&method=setPermission&value=private`,
          {
            method: 'PUT',
            credentials: 'same-origin'
          }
        )
      );

      assert.deepEqual(
        gen.throw('error').value,
        put(actions.saveFail('error'))
      );

      assert.deepEqual(
        gen.next(),
        { done: true, value: undefined }
      );
    });
  });
});
