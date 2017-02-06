import { BackButton } from 'components/BackButton';

describe('components/BackButton', function() {
  function defaultProps() {
    return {
      onClick: _.noop
    };
  }

  function getProps(props = {}) {
    return {...defaultProps(), ...props};
  }

  it('renders', function() {
    var element = renderComponent(BackButton, getProps());
    expect(element).to.exist;
    expect(element.className).to.match(/back-button/);
  });

  it('calls the onClick prop function on click', function() {
    var spy = sinon.spy();
    var element = renderComponent(BackButton, getProps({ onClick: spy }));
    TestUtils.Simulate.click(element);
    expect(spy).to.have.been.called;
  });
});
