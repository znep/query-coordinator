import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderPureComponent } from '../../helpers';
import FilterFooter from 'components/FilterBar/FilterFooter';

describe('FilterFooter', () => {
  let handlerStub;
  let element;
  let button;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      disableApplyFilter: false,
      onClickApply: _.noop,
      onClickRemove: _.noop,
      onClickReset: _.noop
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

      expect(button).to.have.attribute('disabled');
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      handlerStub = sinon.stub();
      element = renderPureComponent(FilterFooter(getProps({
        onClickRemove: handlerStub
      })));
      button = element.querySelector('.remove-btn');
    });

    it('renders a button', () => {
      expect(button).to.exist;
    });

    it('calls handler on click', () => {
      Simulate.click(button);

      expect(handlerStub).to.have.been.called;
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      handlerStub = sinon.stub();
      element = renderPureComponent(FilterFooter(getProps({
        onClickReset: handlerStub
      })));
      button = element.querySelector('.reset-btn');
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
