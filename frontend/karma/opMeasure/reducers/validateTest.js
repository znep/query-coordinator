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
    it('succeeds if the coreView name is within limits', () => {
      // previously invalid, with valid name supplied
      state = _.merge({}, state, {
        coreView: { name: 'example' },
        validationErrors: { measureName: true }
      });

      state = reducer(state, actions.validateMeasureName());
      assert.nestedPropertyVal(state, 'validationErrors.measureName', false);
    });

    it('fails if the coreView name is blank', () => {
      state = _.merge({}, state, {
        coreView: { name: '   ' },
        validationErrors: { measureName: false }
      });

      state = reducer(state, actions.validateMeasureName());
      assert.nestedPropertyVal(state, 'validationErrors.measureName', true);
    });

    it('fails if the coreView name exceeds length limits', () => {
      state = _.merge({}, state, {
        coreView: { name: _.repeat('*', 255) },
        validationErrors: { measureName: false }
      });

      state = reducer(state, actions.validateMeasureName());
      assert.nestedPropertyVal(state, 'validationErrors.measureName', true);
    });

    it('trims and normalizes spaces', () => {
      state = _.merge({}, state, {
        coreView: { name: '  test       case  ' }
      });

      state = reducer(state, actions.validateMeasureName());
      assert.nestedPropertyVal(state, 'coreView.name', 'test case');
    });
  });

  describe('VALIDATE_MEASURE_SHORT_NAME', () => {
    it('succeeds if the measure short name is within limits', () => {
      // previously invalid, with valid short name supplied
      state = _.merge({}, state, {
        measure: { metadata: { shortName: 'example' } },
        validationErrors: { measureShortName: true }
      });

      state = reducer(state, actions.validateMeasureShortName());
      assert.nestedPropertyVal(state, 'validationErrors.measureShortName', false);
    });

    it('fails if the measure short name exceeds length limits', () => {
      state = _.merge({}, state, {
        measure: { metadata: { shortName: _.repeat('*', 27) } },
        validationErrors: { measureShortName: false }
      });

      state = reducer(state, actions.validateMeasureShortName());
      assert.nestedPropertyVal(state, 'validationErrors.measureShortName', true);
    });

    it('trims and normalizes spaces', () => {
      state = _.merge({}, state, {
        measure: { metadata: { shortName: '  test       case  ' } }
      });

      state = reducer(state, actions.validateMeasureShortName());
      assert.nestedPropertyVal(state, 'measure.metadata.shortName', 'test case');
    });
  });

  describe('VALIDATE_MEASURE_DESCRIPTION', () => {
    it('trims spaces', () => {
      state = _.merge({}, state, {
        coreView: { description: '  test  \r\n  case  ' }
      });

      state = reducer(state, actions.validateMeasureDescription());
      assert.nestedPropertyVal(state, 'coreView.description', 'test  \r\n  case');
    });
  });

  xdescribe('VALIDATE_ALL', () => {

  });
});
