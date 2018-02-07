import { call, put, select } from 'redux-saga/effects';
import { cloneableGenerator } from 'redux-saga/utils';
import { assert } from 'chai';
import {
  fetchPermissions,
  savePermissions,
  publishView,
  addSelectedUsers
} from 'common/components/AccessManager/sagas/PermissionsSagas';
import { MODES, PUBLISHED_VIEWER_ACCESS_LEVEL, ACCESS_LEVELS, ACCESS_LEVEL_VERSIONS } from 'common/components/AccessManager/Constants';
import * as selectors from 'common/components/AccessManager/sagas/Selectors';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';
import * as uiActions from 'common/components/AccessManager/actions/UiActions';
import { permissionsUrl, fetchJsonWithDefaults, publishUrl } from 'common/components/AccessManager/Util';

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

  const assertGeneratorIsDone = (gen) => {
    assert.deepEqual(
      gen.next(),
      { done: true, value: undefined }
    );
  };

  describe('fetchPermissions', () => {
    const defaultGen = cloneableGenerator(fetchPermissions)();

    assert.deepEqual(
      defaultGen.next().value,
      select(selectors.getCurrentView)
    );

    assert.deepEqual(
      defaultGen.next({ id: fakeAssetId }).value,
      select(selectors.getUiMode)
    );

    const getGenerator = (mode) => {
      const clone = defaultGen.clone();

      assert.deepEqual(
        clone.next(mode).value,
        call(
          fetchJsonWithDefaults,
          permissionsUrl(fakeAssetId)
        )
      );

      return clone;
    };


    it('fetches permissions', () => {
      const gen = getGenerator(MODES.MANAGE_COLLABORATORS);

      assert.deepEqual(
        gen.next(mockPermissions).value,
        put(permissionsActions.fetchPermissionsSuccess(mockPermissions))
      );

      assertGeneratorIsDone(gen);
    });

    it('catches errors', () => {
      const gen = getGenerator(MODES.MANAGE_COLLABORATORS);

      assert.deepEqual(
        gen.throw('error').value,
        put(permissionsActions.fetchPermissionsFail('error'))
      );

      assertGeneratorIsDone(gen);
    });

    it('checks for errors from core', () => {
      const gen = getGenerator(MODES.MANAGE_COLLABORATORS);

      const mockResponse = {
        error: true,
        reason: 'Some error'
      };

      // fake getting back the response from the fetch call
      assert.deepEqual(
        gen.next(mockResponse).value,
        put(permissionsActions.fetchPermissionsFail(mockResponse))
      );

      assertGeneratorIsDone(gen);
    });
  });

  describe('savePermissions', () => {
    const defaultGen = cloneableGenerator(savePermissions)();

    assert.deepEqual(
      defaultGen.next().value,
      select(selectors.getUiMode)
    );

    const getGenerator = (mode) => {
      const clone = defaultGen.clone();

      assert.deepEqual(
        clone.next(mode).value,
        select(selectors.getAssetUid)
      );

      assert.deepEqual(
        clone.next(fakeAssetId).value,
        call(addSelectedUsers, mode)
      );

      assert.deepEqual(
        clone.next().value,
        select(selectors.getPermissions)
      );

      assert.deepEqual(
        clone.next(mockPermissions).value,
        call(
          fetchJsonWithDefaults,
          permissionsUrl(fakeAssetId),
          {
            method: 'PUT',
            body: JSON.stringify(mockPermissions)
          }
        )
      );

      return clone;
    };

    it('saves permissions', () => {
      const gen = getGenerator(MODES.CHANGE_OWNER);

      assert.deepEqual(
        gen.next().value,
        put(permissionsActions.saveSuccess())
      );

      assertGeneratorIsDone(gen);
    });

    it('catches errors', () => {
      const gen = getGenerator(MODES.CHANGE_OWNER);

      assert.deepEqual(
        gen.throw('error').value,
        put(permissionsActions.saveFail('error'))
      );

      assertGeneratorIsDone(gen);
    });

    it('publishes on save if in publish mode', () => {
      const gen = getGenerator(MODES.PUBLISH);

      assert.deepEqual(
        gen.next(mockPermissions).value,
        call(publishView, fakeAssetId)
      );

      assertGeneratorIsDone(gen);
    });
  });

  describe('publishView', () => {
    const defaultGen = cloneableGenerator(publishView)(fakeAssetId);

    assert.deepEqual(
      defaultGen.next().value,
      call(
        fetchJsonWithDefaults,
        publishUrl(fakeAssetId),
        { method: 'POST' }
      )
    );

    it('puts redirect action on success', () => {
      const gen = defaultGen.clone();

      const fakeUid = 'fake-uuid';

      assert.deepEqual(
        gen.next({ id: fakeUid }).value,
        put(uiActions.redirectTo(`/d/${fakeUid}`))
      );

      assertGeneratorIsDone(gen);
    });

    it('errors when given invalid published view', () => {
      const gen = defaultGen.clone();

      let errorCaught = false;
      try {
        gen.next({ not: 'a view' });
      } catch (error) {
        errorCaught = true;
      }

      assert.isTrue(errorCaught);

      assertGeneratorIsDone(gen);
    });
  });

  describe('addSelectedUsers', () => {
    const someUsers = [
      {
        id: 'some-user'
      },
      {
        id: 'othe-rusr'
      }
    ];

    const someAccessLevel = {
      name: ACCESS_LEVELS.CONTRIBUTOR,
      version: ACCESS_LEVEL_VERSIONS.ALL
    };

    it('grabs published to when mode is change_audience', () => {
      const gen = addSelectedUsers(MODES.CHANGE_AUDIENCE);

      assert.deepEqual(
        gen.next().value,
        select(selectors.getSelectedPublishTo)
      );

      assert.deepEqual(
        gen.next(someUsers).value,
        put(permissionsActions.addUsers(someUsers, PUBLISHED_VIEWER_ACCESS_LEVEL))
      );

      assertGeneratorIsDone(gen);
    });

    it('grabs selected users from state', () => {
      const gen = addSelectedUsers(MODES.MANAGE_COLLABORATORS);

      assert.deepEqual(
        gen.next().value,
        select(selectors.getSelectedUsers)
      );

      assert.deepEqual(
        gen.next(someUsers).value,
        select(selectors.getAccessLevel)
      );

      assert.deepEqual(
        gen.next(someAccessLevel).value,
        put(permissionsActions.addUsers(someUsers, someAccessLevel))
      );

      assertGeneratorIsDone(gen);
    });
  });
});
