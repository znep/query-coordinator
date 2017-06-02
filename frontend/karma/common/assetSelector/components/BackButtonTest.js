import sinon from 'sinon';
import { expect, assert } from 'chai';
import { BackButton } from 'components/BackButton';

describe('BackButton', function() {
  const defaultProps = {
    onClick: _.noop
  };

  function getProps(props = {}) {
    return {...defaultProps, ...props};
  }

  it('renders', function() {
    var element = renderComponent(BackButton, getProps());
    assert.isDefined(element);
    assert.match(element.className, /back-button/);
  });

  it('calls the onClick prop function on click', function() {
    var spy = sinon.spy();
    var element = renderComponent(BackButton, getProps({ onClick: spy }));
    TestUtils.Simulate.click(element);
    sinon.assert.calledOnce(spy);
  });
});
