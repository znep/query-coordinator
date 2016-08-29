/*
helpers for testing Redux flows which include IO and multiple actions, e.g.

  1. user clicks a button, dispatching thunk
  2. thunk dispatches an action to show a "loading" state in the UI
  3. thunk calls `fetch` s.t. it will dispatch another action when it completes
  4. action completes, showing a "success" or "failure" state in the UI

tested in meta/asyncUtils.js
*/


// something like this probably already exists in NPM
export function testThunk(done, actionThunk, wholeState, expectationThunks) {
  let curExpectationThunkIdx = 0;
  let curState = wholeState;
  actionThunk(
    (dispatchedAction) => {
      assert(
        curExpectationThunkIdx < expectationThunks.length,
        `more actions dispatched than expectation thunks (${expectationThunks.length} thunks supplied); ` +
        `extra action: ${JSON.stringify(dispatchedAction)}`
      );
      const expectationThunk = expectationThunks[curExpectationThunkIdx++];
      curState = expectationThunk(curState, dispatchedAction);
      if (curExpectationThunkIdx === expectationThunks.length) {
        done();
      }
    },
    () => wholeState
  )
}

// expectationThunk: (url, options, resolve: () => (), reject: () => ()) => ()
// make your assertions against the args, then call resolve or reject
export function withMockFetch(expectationThunk, otherThunk) {
  const realFetch = window.fetch;
  window.fetch = (url, options) => {
    return new Promise((resolve, reject) => {
      expectationThunk(url, options, resolve, reject);
    });
  };
  otherThunk();
  window.fetch = realFetch;
}
