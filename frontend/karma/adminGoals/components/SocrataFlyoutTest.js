import { expect, assert } from 'chai';
import Flyout from 'adminGoals/components/SocrataFlyout/SocrataFlyout';

describe('components/SocrataFlyout', function() {
  beforeEach(function() {
    var props = {text: 'something'};
    this.hoverable = <span className="custom-text">custom-hoverable-text</span>;

    this.output = window.renderPureComponent(React.createElement(Flyout, props, this.hoverable));
  });

  it('should have custom text', function() {
    expect(this.output.querySelectorAll('section.flyout-content')[0].innerHTML).to.contain('something');
  });

  it('should have hoverable', function() {
    expect(this.output.querySelectorAll('.custom-text')[0].innerHTML).to.contain('custom-hoverable-text');
  });

  it('should be visible when mouse hovers', function() {
    TestUtils.Simulate.mouseEnter(this.output.querySelector('.custom-text').parentNode);
    expect(this.output.querySelectorAll('.flyout')[0].className).to.not.contain('flyout-hidden')
  });

  it('should not be visible when mouse leaves', function() {
    TestUtils.Simulate.mouseLeave(this.output.querySelector('.custom-text').parentNode);
    expect(this.output.querySelectorAll('.flyout')[0].className).to.contain('flyout-hidden')
  });
});
