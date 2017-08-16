import { assert } from 'chai';
import state from '../data/initialState';
import { mapStateToProps } from 'components/RowDetails';
import dotProp from 'dot-prop-immutable';

describe('RowDetails', () => {

  describe('mapStateToProps', () => {

    it('renders when there is no output schema', () => {
      const stateWithoutOS = dotProp.set(
        state,
        'entities.output_schemas',
        {}
      );
      const props = mapStateToProps(stateWithoutOS);
      assert.deepEqual(props, {
        columnCount: 0,
        rowCount: 0,
        rowLabel: 'row'
      });
    });

    it('renders when there is an output schema, but transforms have no rows yet', () => {
      const transforms = state.entities.transforms;

      const updatedTransforms = Object.keys(transforms).reduce(
        (acc, tid) => ({
          ...acc,
          [tid]: {
            id: tid,
            output_soql_type: transforms[tid].output_soql_type
          }
        }),
        {}
      );

      const stateWithUpdatedTransforms = dotProp.set(
        state,
        'entities.transforms',
        updatedTransforms
      );

      const props = mapStateToProps(stateWithUpdatedTransforms);

      assert.deepEqual(props, {
        columnCount: 22,
        rowCount: 0,
        rowLabel: 'row'
      });
    });

    it('renders when there is an output schema, and transforms have rows', () => {
      const props = mapStateToProps(state);

      assert.deepEqual(props, {
        columnCount: 22,
        rowCount: 9,
        rowLabel: 'row'
      });
    });

  });

});
