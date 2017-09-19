import _ from 'lodash';
import { Simulate } from 'react-dom/test-utils';
import { renderPureComponent } from '../../helpers';
import FilterFooter from 'components/FilterBar/FilterFooter';
import $ from 'jquery';

/* eslint-disable new-cap */
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

    assert.isNotNull(element);
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
      assert.isNotNull(button);
    });

    it('calls handler on click', () => {
      Simulate.click(button);

      sinon.assert.called(handlerStub);
    });

    it('renders a disabled button if disabled', () => {
      element = renderPureComponent(FilterFooter(getProps({
        disableApplyFilter: true
      })));
      button = element.querySelector('.apply-btn');

      assert.isDefined($(button).attr('disabled'));
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
      assert.isNotNull(button);
    });

    it('calls handler on click', () => {
      Simulate.click(button);

      sinon.assert.called(handlerStub);
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
      assert.isNotNull(button);
    });

    it('calls handler on click', () => {
      Simulate.click(button);

      sinon.assert.called(handlerStub);
    });
  });
});
/* eslint-enable new-cap */
