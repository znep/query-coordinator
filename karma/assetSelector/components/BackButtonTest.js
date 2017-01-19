import { BackButton } from 'components/BackButton';

describe('components/BackButton', function() {
  function defaultProps() {
    return {
      onClick: _.noop
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('renders', function() {
    var element = renderPureComponent(BackButton(getProps()));
    expect(element).to.exist;
    expect(element.className).to.eq('back-button');
  });

  it('dispatches the onClick prop on click', function() {
    var spy = sinon.spy();
    var element = renderPureComponent(BackButton(getProps({ onClick: spy })));
    TestUtils.Simulate.click(element.querySelector('.back-button button.close-modal'));
    expect(spy).to.have.been.called;
  });
});
