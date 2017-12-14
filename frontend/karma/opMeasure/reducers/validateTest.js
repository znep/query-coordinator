import _ from 'lodash';
import { assert } from 'chai';

import reducer from 'reducers/validate';
import * as actions from 'actions/validate';

describe('Validation reducer', () => {
  let state;

  beforeEach(() => {
    state = reducer();
  });

  afterEach(() => {
    state = undefined;
  });

  describe('VALIDATE_MEASURE_NAME', () => {
    it('succeeds if the measure name is within limits', () => {
      // previously invalid, with valid name supplied
      state = _.merge({}, state, {
        measure: { name: 'example' },
        validationErrors: { measureName: true }
      });

      state = reducer(state, actions.validateMeasureName());
      assert.nestedPropertyVal(state, 'validationErrors.measureName', false);
    });

    it('fails if the measure name is blank', () => {
      state = _.merge({}, state, {
        measure: { name: '   ' },
        validationErrors: { measureName: false }
      });

      state = reducer(state, actions.validateMeasureName());
      assert.nestedPropertyVal(state, 'validationErrors.measureName', true);
    });

    it('fails if the measure name exceeds length limits', () => {
      state = _.merge({}, state, {
        measure: { name: _.repeat('*', 255) },
        validationErrors: { measureName: false }
      });

      state = reducer(state, actions.validateMeasureName());
      assert.nestedPropertyVal(state, 'validationErrors.measureName', true);
    });

    it('trims and normalizes spaces', () => {
      state = _.merge({}, state, {
        measure: { name: '  test       case  ' }
      });

      state = reducer(state, actions.validateMeasureName());
      assert.nestedPropertyVal(state, 'measure.name', 'test case');
    });
  });

  describe('VALIDATE_MEASURE_SHORT_NAME', () => {
    it('succeeds if the measure short name is within limits', () => {
      // previously invalid, with valid short name supplied
      state = _.merge({}, state, {
        measure: { shortName: 'example' },
        validationErrors: { measureShortName: true }
      });

      state = reducer(state, actions.validateMeasureShortName());
      assert.nestedPropertyVal(state, 'validationErrors.measureShortName', false);
    });

    it('fails if the measure short name exceeds length limits', () => {
      state = _.merge({}, state, {
        measure: { shortName: _.repeat('*', 27) },
        validationErrors: { measureShortName: false }
      });

      state = reducer(state, actions.validateMeasureShortName());
      assert.nestedPropertyVal(state, 'validationErrors.measureShortName', true);
    });

    it('trims and normalizes spaces', () => {
      state = _.merge({}, state, {
        measure: { shortName: '  test       case  ' }
      });

      state = reducer(state, actions.validateMeasureShortName());
      assert.nestedPropertyVal(state, 'measure.shortName', 'test case');
    });
  });

  describe('VALIDATE_MEASURE_DESCRIPTION', () => {
    it('trims spaces', () => {
      state = _.merge({}, state, {
        measure: { description: '  test  \r\n  case  ' }
      });

      state = reducer(state, actions.validateMeasureDescription());
      assert.nestedPropertyVal(state, 'measure.description', 'test  \r\n  case');
    });
  });

  xdescribe('VALIDATE_ALL', () => {

  });
});
