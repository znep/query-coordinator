import {withMockFetch, testThunk} from '../asyncUtils';
import { combineReducers } from 'redux';


describe('withMockFetch', () => {

  it('allows a mock implementation of fetch to assert against parameters, and resolve a mock response', (done) => {
    withMockFetch(
      (url, options, resolve, reject) => {
        expect(url).to.equal('/foo');
        expect(options).to.deep.equal({
          body: 'bar'
        });
        resolve({
          status: 200,
          json: () => Promise.resolve('derp')
        });
      },
      () => {
        fetch('/foo', { body: 'bar' }).then((response) => {
          expect(response.status).to.equal(200);
          response.json().then((json) => {
            expect(json).to.equal('derp');
            done();
          });
        });
      }
    );
  });

});


describe('testThunk', () => {

  it('dispatches to actions sequentially, feeding the response of one thunk to the next', (done) => {
    const thunk = (dispatch) => {
      dispatch({
        type: 'MY_TEST_ACTION',
        foo: 'state1'
      });
      dispatch({
        type: 'ACTION_LATER',
        foo: 'state2'
      });
    };

    function fooUpdate(state, action) {
      switch(action.type) {
        case 'MY_TEST_ACTION':
          return action.foo;
        case 'ACTION_LATER':
          return action.foo;
        default:
          return 'meow';
      }
    }

    const mockUpdate = combineReducers({
      foo: fooUpdate
    });

    testThunk(done, thunk, {foo: 2}, mockUpdate, [
      (state, action) => {
        expect(action).to.deep.equal({
          type: 'MY_TEST_ACTION',
          foo: 'state1'
        });
        expect (state.foo).to.equal('state1');
      },
      (state, action) => {
        expect(state.foo).to.equal('state2');
        expect(action).to.deep.equal({
          type: 'ACTION_LATER',
          foo: 'state2'
        });
      }
    ]);
  });

});


describe('withMockFetch + testThunk', () => {

  const myThunk = (dispatch) => {
    dispatch({ type: 'LOAD_STARTED' });
    fetch('/foo', { body: 'bar' }).then((response) => {
      dispatch({ type: 'LOAD_FINISHED' })
    });
    // problem: a .catch here will catch assertion errors, which should be out-of-band
    // how can we test failure cases?
  };

  const myUpdate = (state, action) => {
    switch (action.type) {
      case 'LOAD_STARTED':
        return 'loadingState';

      case 'LOAD_FINISHED':
        return 'finishedState';
    }
  };

  it('allows you to test a `loading action => IO => IO returns => done action` sequence', (done) => {
    withMockFetch(
      (url, options, resolve, reject) => {
        expect(url).to.equal('/foo');
        expect(options).to.deep.equal({
          body: 'bar'
        });
        resolve({
          status: 200,
          json: () => Promise.resolve('derp')
        });
      },
      () => {
        testThunk(done, myThunk, 'initialState', myUpdate, [
          (state, action) => {
            expect(action).to.deep.equal({ type: 'LOAD_STARTED' });
            expect(state).to.equal('loadingState');
          },
          (state, action) => {
            expect(action).to.deep.equal({ type: 'LOAD_FINISHED' });
            expect(state).to.equal('finishedState');
          }
        ]);
      }
    );
  });

});
