import _ from 'lodash';
import React, { Component } from 'react';
import sinon from 'sinon';
import { shallow, mount } from 'enzyme';

import spandexSubscriber, { REPLICATION_KEY } from 'common/spandex/subscriber';

const INTERVAL = 1;
const TIMEOUT = 5;

describe('spandexSubscriber', () => {
  const getProps = (props = {}) => ({
    ...props,
    spandex: {
      datasetUid: 'test-test',
      domain: 'example.com',
      ...props.spandex
    }
  });

  describe('HOC constructor', () => {
    it('can use defaults', () => {
      assert.doesNotThrow(() => spandexSubscriber());
    });

    it('requires positive numbers for parameters', () => {
      assert.throws(() => spandexSubscriber(null));
      assert.throws(() => spandexSubscriber(0));
      assert.throws(() => spandexSubscriber(-1));
      assert.throws(() => spandexSubscriber(0.01, null));
      assert.throws(() => spandexSubscriber(0.01, 0));
      assert.throws(() => spandexSubscriber(0.01, -1));
      assert.doesNotThrow(() => spandexSubscriber(0.01, 0.01));
    });
  });

  // NOTE: There's some weirdness in these tests due to stubbing window.fetch
  // and async assertions. I believe I have fixed the cases where tests were
  // passing individually but failing due to some cross-test interaction, but
  // there's probably room for improvement in how these tests are written.
  describe('HOC', () => {
    const MockComponent = () => <div />;
    MockComponent.displayName = 'MockComponent';

    // This test shouldn't need to be async, but its synchronous execution was
    // being affected by the window.fetch stub in following async tests. Grrrr.
    // (Symptom: later tests fail due to fetch stub being called *twice*.)
    it('returns a decorated React component', (done) => {
      const props = getProps({ testProp: 'testValue' });
      const Wrapped = spandexSubscriber(INTERVAL, TIMEOUT)(MockComponent);
      const element = shallow(<Wrapped {...props} />);
      const instance = element.instance();

      _.defer(() => {
        assert.isTrue(element.first().is(MockComponent));
        assert.include(instance.props, { testProp: 'testValue' });
        assert.property(instance.props.spandex, 'available');
        assert.property(instance.props.spandex, 'provider');

        done();
      });
    });

    describe('polling behavior', () => {
      let fetch;

      beforeEach(() => {
        fetch = sinon.stub(window, 'fetch');
      });

      afterEach(() => {
        fetch.restore();
      });

      // `available: false` = "replication in progress"
      // `available` value after check should match response value
      it('updates the available prop according to replication status', (done) => {
        const responseBody = JSON.stringify({ [REPLICATION_KEY]: 'foo' });
        const response = new Response(responseBody, {
          status: 200,
          headers: { 'Content-type': 'application/json' }
        });
        fetch.returns(Promise.resolve(response));

        const props = getProps();
        const Wrapped = spandexSubscriber(INTERVAL, TIMEOUT)(MockComponent);
        const element = mount(<Wrapped {...props} />);
        element.setState({ available: false });

        _.defer(() => {
          sinon.assert.calledOnce(fetch);
          sinon.assert.calledWithExactly(fetch, '/api/views/test-test/replication.json', sinon.match.object);

          const instance = element.instance();
          assert.include(instance.props.spandex, { available: 'foo' });

          done();
        });
      });

      // `available: undefined` = "no replication exists"
      // `available` value after poke should become `false`
      it('initiates replication on unreplicated datasets', (done) => {
        const responseBody = null;
        const response = new Response(responseBody, { status: 204 });
        fetch.returns(Promise.resolve(response));

        const props = getProps();
        const Wrapped = spandexSubscriber(INTERVAL, TIMEOUT)(MockComponent);
        const element = mount(<Wrapped {...props} />);
        element.setState({ available: undefined });

        _.defer(() => {
          sinon.assert.calledOnce(fetch);
          sinon.assert.calledWithExactly(fetch, '/datasets/test-test/setup_autocomplete', sinon.match.object);

          const instance = element.instance();
          assert.include(instance.props.spandex, { available: false });

          done();
        });
      });

      // NOTE: I'm not sure if this test is written the best way possible, but
      // it's the only way that I was consistently able to get definitive
      // confirmation of the behavior.
      it('does not initiate replication more than once', (done) => {
        const responseBody = null;
        const response = new Response(responseBody, { status: 204 });
        fetch.returns(Promise.resolve(response));

        const props = getProps();
        const Wrapped = spandexSubscriber(INTERVAL, TIMEOUT)(MockComponent);
        const element = mount(<Wrapped {...props} />);

        const initiateSpy = sinon.spy(element.node, 'initiateReplication');
        const checkStub = sinon.stub(element.node, 'checkReplicationStatus');
        const consoleStub = sinon.stub(console, 'log');

        element.node.initiateReplication();

        _.defer(() => {
          element.node.initiateReplication();

          sinon.assert.calledOnce(fetch);

          sinon.assert.calledWithExactly(consoleStub, sinon.match(/attempted to initiate twice/));

          assert.isTrue(initiateSpy.returnValues[0]);
          assert.isFalse(initiateSpy.returnValues[1]);

          done();
        });
      });

    });

  });
});
