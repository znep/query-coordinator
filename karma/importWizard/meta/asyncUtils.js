import {withMockFetch, testThunk} from '../asyncUtils';
import Promise from 'bluebird';


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
        type: 'MY_TEST_ACTION'
      });
      dispatch({
        type: 'ACTION_LATER'
      });
    };
    testThunk(done, thunk, {foo: 2}, [
      (state, action) => {
        expect(action).to.deep.equal({
          type: 'MY_TEST_ACTION'
        });
        return 'new_state';
      },
      (state, action) => {
        expect(state).to.equal('new_state');
        expect(action).to.deep.equal({
          type: 'ACTION_LATER'
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
        testThunk(done, myThunk, 'initialState', [
          (state, action) => {
            expect(state).to.equal('initialState');
            expect(action).to.deep.equal({ type: 'LOAD_STARTED' });
            const newState = myUpdate(state, action);
            expect(newState).to.equal('loadingState');
            return newState;
          },
          (state, action) => {
            expect(state).to.equal('loadingState'); // don't really need this; was asserted in prev thunk
            expect(action).to.deep.equal({ type: 'LOAD_FINISHED' });
            const newState = myUpdate(state, action);
            expect(newState).to.equal('finishedState');
          }
        ]);
      }
    );
  });

});
