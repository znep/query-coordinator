import { assert } from 'chai';
import {
  setFourfour,
  addLocation,
  setOutputSchemaId,
  SET_FOURFOUR,
  ADD_LOCATION,
  SET_OUTPUT_SCHEMA_ID
} from 'actions/routing';

describe('actions/routing', () => {
  describe('actions/routing/setFourfour', () => {
    it('returns an action of the expected shape', () => {
      const expectedAction = {
        type: SET_FOURFOUR,
        fourfour: 'abcd-1234'
      };

      const action = setFourfour(expectedAction.fourfour);

      assert.deepEqual(action, expectedAction);
    });
  });

  describe('actions/routing/setOutputSchemaId', () => {
    it('returns an action of the expected shape', () => {
      const expectedAction = {
        type: SET_OUTPUT_SCHEMA_ID,
        id: 388
      };

      const action = setOutputSchemaId(expectedAction.id);

      assert.deepEqual(action, expectedAction);
    });
  });

  describe('actions/routing/addLocation', () => {
    it('returns an action of the expected shape', () => {
      it('returns an action of the expected shape', () => {
        const expectedAction = {
          type: ADD_LOCATION,
          location: {
            pathname: '/dataset/kjkjkjk/8ftf-gp92/revisions/0/sources/244/schemas/1732/output/355',
            search: '',
            hash: '',
            action: 'POP',
            key: 'rr69kr',
            query: {}
          }
        };

        const action = addLocation(expectedAction.location);

        assert.deepEqual(action, expectedAction);
      });
    });
  })
});
