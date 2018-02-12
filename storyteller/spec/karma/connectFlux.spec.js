import _ from 'lodash';
import React, { Component } from 'react';
import sinon from 'sinon';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';

import { dispatcher } from 'editor/Dispatcher';
import connectFlux from 'editor/connectFlux';
import Store from 'editor/stores/Store';

class InnerComponent extends Component {
  render() {
    return <div>Hello</div>;
  }
}

describe('connectFlux HOC', () => {
  // Dispatcher.register gives us tokens that we should use to unregister when we're done.
  const registeredTokens = [];

  afterEach(() => {
    _.each(registeredTokens, (token) => dispatcher.unregister(token));
    registeredTokens.length = 0;
  });

  function TestStore() {
    _.extend(this, new Store());
    sinon.spy(this, 'addChangeListener');
    sinon.spy(this, 'removeChangeListener');
    this.testState = 'initial state';

    this.register((payload) => {
      this.testState = payload.data;
      this._emitChange();
    });
    registeredTokens.push(this.getDispatcherToken());

    this.getTestState = () => {
      return this.testState;
    };
  }

  describe('mapDispatchToProps', () => {
    let mapDispatchToPropsSpy;
    let Wrapped;
    let element;

    beforeEach(() => {
      mapDispatchToPropsSpy = sinon.stub().returns({ foo: 'bar' });
      Wrapped = connectFlux({}, _.noop, mapDispatchToPropsSpy)(InnerComponent);
      element = shallow(<Wrapped />);
    });

    it('is called with dispatcher', () => {
      // Ideally we'd just check the arg === dispatcher.dispatch. Unfortunately,
      // the references don't seem to line up (probably webpack related). Instead
      // we just call the provided dispatch function and see if it actually emits
      // an action.
      const actionStub = sinon.stub();
      const action = { action: 'foo' };
      registeredTokens.push(dispatcher.register(actionStub));
      mapDispatchToPropsSpy.getCall(0).args[0](action);
      sinon.assert.calledWithExactly(actionStub, action);
    });

    it('contributes to props', () => {
      assert.equal(
        'bar',
        element.find(InnerComponent).prop('foo')
      );
    });
  });

  describe('mapStateToProps', () => {
    let testStore1;
    let testStore2;
    let mapStateToPropsSpy;
    let Wrapped;
    let element;

    beforeEach(() => {
      mapStateToPropsSpy = sinon.stub().returns({ foo: 'bar' });
      testStore1 = new TestStore();
      testStore2 = new TestStore();
      Wrapped = connectFlux({ testStore1, testStore2 }, mapStateToPropsSpy)(InnerComponent);
      element = shallow(<Wrapped />);
    });

    it('is called with stores passed into first argument of connectFlux', () => {
      sinon.assert.calledWithMatch(
        mapStateToPropsSpy,
        { testStore1, testStore2 }
      );
    });

    it('contributes to props', () => {
      assert.equal(
        'bar',
        element.find(InnerComponent).prop('foo')
      );
    });
  });

  describe('mapStateToProps combined with mapDispatchToProps', () => {
    let Wrapped;
    let element;

    beforeEach(() => {
      Wrapped = connectFlux(
        {},
        _.constant({ stateProp: 'stateful thing' }),
        _.constant({ dispatchProp: 'dispatchey thing' })
      )(InnerComponent);
      element = shallow(<Wrapped />);
    });

    it('takes all contributions to props', () => {
      assert.equal(
        'stateful thing',
        element.find(InnerComponent).prop('stateProp')
      );

      assert.equal(
        'dispatchey thing',
        element.find(InnerComponent).prop('dispatchProp')
      );
    });
  });

  it('passes through props', () => {
    const Wrapped = connectFlux({}, _.noop)(InnerComponent);

    const element = shallow(<Wrapped foo="bar" />);
    assert.equal(
      'bar',
      element.find(InnerComponent).prop('foo')
    );
  });

  describe('when instantiated but not mounted', () => {
    let testStore;
    let Wrapped;
    let element;

    beforeEach(() => {
      testStore = new TestStore();
      Wrapped = connectFlux(
        { testStore },
        // Disabling lint check here - I want to keep this spec in line with how the
        // component would be used in real life. The shadowing is only a concern here
        // because the stores are declared in the same file.
        ({testStore}) => ({ // eslint-disable-line no-shadow
          myProp: testStore.getTestState()
        })
      )(InnerComponent);
      element = shallow(<Wrapped />);
    });

    it('provides initial set of props', () => {
      assert.equal(
        'initial state',
        element.find(InnerComponent).prop('myProp')
      );
    });

    it('does not attach a change listener', () => {
      sinon.assert.notCalled(testStore.addChangeListener);
      sinon.assert.notCalled(testStore.removeChangeListener);
    });
  });

  describe('when mounted', () => {
    let testStore1;
    let testStore2;
    let Wrapped;
    let element;

    beforeEach(() => {
      testStore1 = new TestStore();
      testStore2 = new TestStore();
      Wrapped = connectFlux(
        { testStore1, testStore2 },
        // Disabling lint check here - I want to keep this spec in line with how the
        // component would be used in real life. The shadowing is only a concern here
        // because the stores are declared in the same file.
        ({testStore1, testStore2}) => ({ // eslint-disable-line no-shadow
          myProp1: testStore1.getTestState(),
          myProp2: testStore2.getTestState()
        })
      )(InnerComponent);
      element = mount(<Wrapped />);
    });

    afterEach(() => {
      element.unmount();
    });

    it('adds a change listener on mount and removes it on unmount', () => {
      sinon.assert.calledOnce(testStore1.addChangeListener);
      sinon.assert.notCalled(testStore1.removeChangeListener);
      sinon.assert.calledOnce(testStore2.addChangeListener);
      sinon.assert.notCalled(testStore2.removeChangeListener);

      // Store the actual callbacks that were provided so we can make
      // sure the args removeChangeListener later match up.
      const testStore1ChangeListener = testStore1.addChangeListener.getCall(0).args[0];
      const testStore2ChangeListener = testStore2.addChangeListener.getCall(0).args[0];

      testStore1.addChangeListener.reset();
      testStore1.removeChangeListener.reset();
      testStore2.addChangeListener.reset();
      testStore2.removeChangeListener.reset();

      element.unmount();
      sinon.assert.notCalled(testStore1.addChangeListener);
      sinon.assert.calledOnce(testStore1.removeChangeListener);
      sinon.assert.notCalled(testStore2.addChangeListener);
      sinon.assert.calledOnce(testStore2.removeChangeListener);

      assert.equal(
        testStore1ChangeListener,
        testStore1.removeChangeListener.getCall(0).args[0]
      );
      assert.equal(
        testStore2ChangeListener,
        testStore2.removeChangeListener.getCall(0).args[0]
      );
    });

    it('updates props on store change', () => {
      assert.equal(
        'initial state',
        element.find(InnerComponent).prop('myProp1')
      );
      assert.equal(
        'initial state',
        element.find(InnerComponent).prop('myProp2')
      );

      dispatcher.dispatch({
        action: 'dummy', // TestStore does not care.
        data: 'new state'
      });

      assert.equal(
        'new state',
        element.find(InnerComponent).prop('myProp1')
      );
      assert.equal(
        'new state',
        element.find(InnerComponent).prop('myProp2')
      );
    });
  });
});
