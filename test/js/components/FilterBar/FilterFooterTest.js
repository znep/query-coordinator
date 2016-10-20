import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import FilterFooter from 'components/FilterBar/FilterFooter';

describe('FilterFooter', () => {
  let handlerStub;
  let element;
  let button;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      disableApplyFilter: false,
      onClickApply: _.noop,
      onClickCancel: _.noop,
      onClickClear: _.noop
    });
  }

  it('renders an element', () => {
    element = renderPureComponent(FilterFooter(getProps()));

    expect(element).to.exist;
  });

  describe('apply', () => {
    beforeEach(() => {
      handlerStub = sinon.stub();
      element = renderPureComponent(FilterFooter(getProps({
        onClickApply: handlerStub
      })));
      button = element.querySelector('.apply-btn');
    });

    it('renders a button', () => {
      expect(button).to.exist;
    });

    it('calls handler on click', () => {
      Simulate.click(button);

      expect(handlerStub).to.have.been.called;
    });

    it('renders a disabled button if disabled', () => {
      element = renderPureComponent(FilterFooter(getProps({
        disableApplyFilter: true
      })));
      button = element.querySelector('.apply-btn');

      expect(button.disabled).to.eq(true);
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      handlerStub = sinon.stub();
      element = renderPureComponent(FilterFooter(getProps({
        onClickClear: handlerStub
      })));
      button = element.querySelector('.clear-btn');
    });

    it('renders a button', () => {
      expect(button).to.exist;
    });

    it('calls handler on click', () => {
      Simulate.click(button);

      expect(handlerStub).to.have.been.called;
    });
  });

  describe('cancel', () => {
    beforeEach(() => {
      handlerStub = sinon.stub();
      element = renderPureComponent(FilterFooter(getProps({
        onClickCancel: handlerStub
      })));
      button = element.querySelector('.cancel-btn');
    });

    it('renders a button', () => {
      expect(button).to.exist;
    });

    it('calls handler on click', () => {
      Simulate.click(button);

      expect(handlerStub).to.have.been.called;
    });
  });
});
