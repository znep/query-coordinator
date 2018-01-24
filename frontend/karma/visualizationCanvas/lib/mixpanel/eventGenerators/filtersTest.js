import sinon from 'sinon';

import { generateFilterEvents } from 'visualizationCanvas/lib/mixpanel/eventGenerators/filters';

// A few helpers to make test verifier data generation less tedious.
const eventProps = (type, hidden) => ({
  'Column Type': type, 'Hidden': hidden
});

const addMatcher = (properties) => ({
  name: sinon.match(/\bAdded\b/i), properties
});

const removeMatcher = (properties) => ({
  name: sinon.match(/\bRemoved\b/i), properties
});

const changeValuesMatcher = (properties) => ({
  name: sinon.match(/\bChanged\b.+\bValues\b/i), properties
});

const resetValuesMatcher = (properties) => ({
  name: sinon.match(/\bReset\b.+\bValues\b/i), properties
});

const changeVisibilityMatcher = (properties) => ({
  name: sinon.match(/\bChanged\b.+\bVisibility\b/i), properties
});

describe('Mixpanel event generator for filters', () => {
  let events;

  const state = {
    view: {
      columns: [
        { fieldName: 'flabbergasts', dataTypeName: 'noise' },
        { fieldName: 'frozzbits', dataTypeName: 'currency' }
      ]
    },
    filters: [
      {
        arguments: { start: 9, end: 10.000001 },
        columnName: 'frozzbits',
        function: 'valueRange',
        isHidden: false
      },
      {
        arguments: null,
        columnName: 'flabbergasts',
        function: 'noop',
        isHidden: true
      }
    ]
  };

  const verifyEvents = (expected, consoleErrorInvocationCount = 0) => {
    sinon.assert.match(events, expected);
    sinon.assert.callCount(console.error, consoleErrorInvocationCount);
  }

  beforeEach(() => {
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    console.error.restore();
  });

  const sharedExamples = (eventType) => {
    describe(`(type ${eventType})`, () => {
      let newState;

      beforeEach(() => {
        newState = _.cloneDeep(state);
      });

      // NOTE: This should never actually happen, since we only want to invoke
      // this method in response to filter changes, but better to be thorough.
      describe('when states match', () => {
        it('returns an empty array', () => {
          events = generateFilterEvents(state, newState, eventType);
          verifyEvents([]);
        });
      });

      describe('when a filter has been added', () => {
        it('generates an event', () => {
          newState.filters.push(
            {
              arguments: null,
              columnName: 'flanges',
              function: 'noop',
              isHidden: true
            }
          );

          events = generateFilterEvents(state, newState, eventType);
          verifyEvents([
            addMatcher(eventProps('<unknown>', true))
          ]);
        });
      });

      describe('when a filter has been removed', () => {
        it('generates an event', () => {
          newState.filters.shift();

          events = generateFilterEvents(state, newState, eventType);
          verifyEvents([
            removeMatcher(eventProps('currency', false))
          ]);
        });
      });

      describe('when a filter has changed values', () => {
        it('generates an event', () => {
          newState.filters[0].arguments.start = 8;

          events = generateFilterEvents(state, newState, eventType);
          verifyEvents([
            changeValuesMatcher(eventProps('currency', false))
          ]);
        });
      });

      describe('when a filter has reset values', () => {
        it('generates an event', () => {
          newState.filters[0].arguments = null;
          newState.filters[0].function = 'noop';

          events = generateFilterEvents(state, newState, eventType);
          verifyEvents([
            resetValuesMatcher(eventProps('currency', false))
          ]);
        });
      });

      describe('when a filter has visibility toggled', () => {
        it('generates an event', () => {
          newState.filters[0].isHidden = true;

          events = generateFilterEvents(state, newState, eventType);
          verifyEvents([
            changeVisibilityMatcher(eventProps('currency', true))
          ]);
        });
      });

      // NOTE: This should never actually happen for type "transient"... but
      // once again, being thorough.
      describe('when there are multiple changes to filters', () => {
        it('generates multiple events', () => {
          newState.filters[1].arguments = { start: 1, end: 2.000001 };
          newState.filters[1].function = 'valueRange';
          newState.filters[1].isHidden = false;
          newState.filters.push({
            arguments: null,
            columnName: 'flanges',
            function: 'noop',
            isHidden: true
          });
          newState.filters.shift();

          events = generateFilterEvents(state, newState, eventType);
          verifyEvents([
            addMatcher(eventProps('<unknown>', true)),
            removeMatcher(eventProps('currency', false)),
            changeValuesMatcher(eventProps('noise', false)),
            changeVisibilityMatcher(eventProps('noise', false)),
          ]);
        });
      });
    });
  };

  sharedExamples('transient');
  sharedExamples('pristine');

  describe('when passed an invalid old state', () => {
    it('returns an empty array', () => {
      events = generateFilterEvents(null, state, 'transient');
      verifyEvents([], 1);

      console.error.resetHistory();

      events = generateFilterEvents(undefined, state, 'transient');
      verifyEvents([], 1);
    });
  });

  describe('when passed an invalid new state', () => {
    it('returns an empty array', () => {
      events = generateFilterEvents(state, null, 'transient');
      verifyEvents([], 1);

      console.error.resetHistory();

      events = generateFilterEvents(state, undefined, 'transient');
      verifyEvents([], 1);
    });
  });

  describe('when passed an invalid event type', () => {
    it('returns an empty array', () => {
      events = generateFilterEvents(state, state, null);
      verifyEvents([], 1);

      console.error.resetHistory();

      events = generateFilterEvents(state, state, undefined);
      verifyEvents([], 1);

      console.error.resetHistory();

      events = generateFilterEvents(state, state, 'unknown');
      verifyEvents([], 1);
    });
  });
});
