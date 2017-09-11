import { assert } from 'chai';
import { parseDate } from 'lib/parseDate';
import dotProp from 'dot-prop-immutable';
import {
  mapStateToProps,
  findMatchingApiCall
} from 'containers/ApiCallButtonContainer';

describe('containers/ApiCallButtonContainer', () => {
  const SCALED_TEST_TIME_LIMIT = Infinity

  const apiCalls = {
    '00541ed7-7424-4355-ac41-8fff03ef4a67': {
      id: '00541ed7-7424-4355-ac41-8fff03ef4a67',
      status: 'STATUS_CALL_SUCCEEDED',
      operation: 'LOAD_ROWS',
      callParams: {
        displayState: {
          type: 'NORMAL',
          pageNo: 3,
          outputSchemaId: 683
        }
      },
      startedAt: parseDate(new Date().toISOString()),
      succeededAt: parseDate(new Date().toISOString())
    },
    'e6e1a8f9-30f6-408c-92fe-26e7441f922c': {
      id: 'e6e1a8f9-30f6-408c-92fe-26e7441f922c',
      status: 'STATUS_CALL_SUCCEEDED',
      operation: 'SAVE_CURRENT_OUTPUT_SCHEMA',
      callParams: {
        outputSchemaId: 683
      },
      startedAt: parseDate(new Date().toISOString()),
      succeededAt: parseDate(new Date().toISOString())
    }
  };

  describe('findMatchingApiCall', () => {
    it('returns api call if there is a match', () => {
      const match = findMatchingApiCall(
        apiCalls,
        'SAVE_CURRENT_OUTPUT_SCHEMA',
        { outputSchemaId: 683 },
        SCALED_TEST_TIME_LIMIT
      );

      assert.ok(match);
      assert.equal(match.id, 'e6e1a8f9-30f6-408c-92fe-26e7441f922c');
    });

    it("excludes calls if callParams don't match", () => {
      const match = findMatchingApiCall(
        apiCalls,
        'SAVE_CURRENT_OUTPUT_SCHEMA',
        { outputSchemaId: 44 },
        SCALED_TEST_TIME_LIMIT
      );

      assert.isUndefined(match);
    });

    it("excludes calls if operations don't match", () => {
      const match = findMatchingApiCall(apiCalls, 'WEEE', {
        outputSchemaId: 683
      }, SCALED_TEST_TIME_LIMIT);

      assert.isUndefined(match);
    });

    it('excludes calls if completed/failed outside specified timeframe', () => {
      const updatedApiCalls = dotProp.set(
        apiCalls,
        'e6e1a8f9-30f6-408c-92fe-26e7441f922c',
        existing => ({
          ...existing,
          startedAt: '2017-04-25T20:13:28.172Z',
          succeededAt: '2017-04-25T20:13:28.172Z'
        })
      );

      const match = findMatchingApiCall(
        updatedApiCalls,
        'SAVE_CURRENT_OUTPUT_SCHEMA',
        {
          outputSchemaId: 683
        },
        SCALED_TEST_TIME_LIMIT
      );

      assert.isUndefined(match);
    });
  });

  describe('mapStateToProps', () => {
    it('returns the call status as status if there is a match', () => {
      const ownProps = {
        operation: 'SAVE_CURRENT_OUTPUT_SCHEMA',
        callParams: {
          outputSchemaId: 683
        },
        limit: SCALED_TEST_TIME_LIMIT
      };

      const state = { ui: { apiCalls } };

      const { status } = mapStateToProps(state, ownProps);

      assert.equal(status, 'STATUS_CALL_SUCCEEDED');
    });

    it('returns null as status if there is no match', () => {
      const ownProps = {
        operation: 'SAVE_CURRENT_OUTPUT_SCHEMA',
        callParams: {
          outputSchemaId: 1111111
        },
        limit: SCALED_TEST_TIME_LIMIT
      };

      const state = { ui: { apiCalls } };

      const { status } = mapStateToProps(state, ownProps);

      assert.isNull(status);
    });
  });
});
