import sinon from 'sinon';
import { expect, assert } from 'chai';
import { FeaturedContentViewCardPlaceholder } from 'catalogLandingPage/components/FeaturedContentViewCardPlaceholder';
import { noop } from 'lodash';

describe('components/FeaturedContentViewCardPlaceholder', () => {
  function getProps(props = {}) {
    return {
      position: 0,
      openManager: noop,
      ...props
    };
  }

  it('renders a FeaturedContentViewCardPlaceholder', () => {
    const element = renderComponent(FeaturedContentViewCardPlaceholder, getProps());
    assert.isNotNull(element);
  });

  it('calls openManager prop on click', () => {
    const spy = sinon.spy();
    const element = renderComponent(FeaturedContentViewCardPlaceholder, getProps({ openManager: spy }));
    TestUtils.Simulate.click(element.querySelector('.add-button'));
    sinon.assert.called(spy);
  });
});
