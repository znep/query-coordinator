import { expect, assert } from 'chai';
import Flyout from 'catalogLandingPage/components/Flyout';

describe('Flyout', () => {
  const defaultProps = {
    right: true,
    text: 'something'
  };

  const getProps = (props = {}) => ({...defaultProps, ...props});

  const hoverableComponent = (<span className="custom-text">custom-hoverable-text</span>);

  it('should have custom text', () => {
    const element = renderComponent(Flyout, getProps(), hoverableComponent);
    expect(element.querySelector('section.flyout-content').textContent).to.equal('something');
  });

  it('should have hoverable', () => {
    const element = renderComponent(Flyout, getProps(), hoverableComponent);
    expect(element.querySelector('.custom-text').textContent).to.equal('custom-hoverable-text');
  });

  it('should be visible when mouse hovers', () => {
    const element = renderComponent(Flyout, getProps(), hoverableComponent);
    TestUtils.Simulate.mouseEnter(element.querySelector('.custom-text').parentNode);
    expect(element.querySelector('.flyout').className).to.not.contain('flyout-hidden')
  });

  it('should not be visible when mouse leaves', () => {
    const element = renderComponent(Flyout, getProps(), hoverableComponent);
    TestUtils.Simulate.mouseLeave(element.querySelector('.custom-text').parentNode);
    expect(element.querySelector('.flyout').className).to.contain('flyout-hidden')
  });
});
