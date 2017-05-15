import { assert } from 'chai';

/*
helpers for testing Redux flows which include IO and multiple actions, e.g.

  1. user clicks a button, dispatching thunk
  2. thunk dispatches an action to show a "loading" state in the UI
  3. thunk calls `fetch` s.t. it will dispatch another action when it completes
  4. action completes, showing a "success" or "failure" state in the UI

tested in meta/asyncUtils.js
*/


// something like this probably already exists in NPM
export function testThunk(done, actionThunk, wholeState, update, assertionThunks) {
  let curState = wholeState;
  const dispatchedActions = []
  function mockDispatch(dispatchedAction) {

    // we can't actually fail this with an assertionbecause delayed actions will cause the wrong test to fail.
    assert(
      dispatchedActions.length < assertionThunks.length,
      `more actions dispatched than expectation thunks (${assertionThunks.length} thunks supplied); ` +
      `extra action: ${JSON.stringify(dispatchedAction)}. ` +
      '\nWARNING: the asynchronous nature of this test & dispatches may have caused the wrong test to fail.'
    )

    if (dispatchedActions.length >= assertionThunks.length) {
      console.error(`TEST FAILED: more actions dispatched than expectation thunks (${assertionThunks.length} thunks supplied); ` +
            `extra action: ${JSON.stringify(dispatchedAction)}`)
    }

    if (typeof dispatchedAction === 'function') {
      dispatchedAction(mockDispatch, () => curState);
    } else {
      // state to compare within the assertionThunk is created from the passed update method
      // this method is a description of how the state is expected to change
      curState = update(curState, dispatchedAction);
      dispatchedActions.push([dispatchedAction, curState]);
    }

    if (dispatchedActions.length === assertionThunks.length) {
      const assertions = _.zip(dispatchedActions, assertionThunks);

      _.forEach(assertions, ([[actualAction, state], assertionThunk]) => {
        // each thunks makes assertions around the action and state that they expect
        // we pass in the action and state that we observed while running the original action
        assertionThunk(state, actualAction)
      })
      done();
    }
  }

  actionThunk(
    mockDispatch,
    () => wholeState
  )
}

// expectationThunk: (url, options, resolve: () => (), reject: () => ()) => ()
// make your assertions against the args, then call resolve or reject
export function withMockFetch(mockFetches, otherThunk) {
  const realFetch = window.fetch;
  const realMockFetches = _.isArray(mockFetches) ? mockFetches : [mockFetches];
  let mockFetchIdx = 0;
  window.fetch = (url, options) => {
    return new Promise((resolve, reject) => {
      assert(
        mockFetchIdx < mockFetches.length,
        `more fetch()s called than mock fetches (${mockFetches.length} supplied); ` +
        `extra args: ${url}, ${JSON.stringify(options)}`
      );
      function realResolve(foo) {
        resolve(foo);
      }
      realMockFetches[mockFetchIdx++](url, options, realResolve, reject);
      if (mockFetchIdx == realMockFetches.length) {
        window.fetch = realFetch;
      }
    });
  };
  otherThunk();
}
