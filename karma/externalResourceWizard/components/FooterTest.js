import _ from 'lodash';
import { Footer } from 'components/Footer';

describe('components/Footer', function() {
  function defaultProps() {
    return {
      onSelect: _.noop,
      selectIsDisabled: false
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('renders', function() {
    var element = renderPureComponentWithStore(Footer(getProps()));
    expect(element).to.exist;
    expect(element.className).to.match(/modal-footer/);
  });

  it('has two buttons', function() {
    var element = renderPureComponentWithStore(Footer(getProps()));
    expect(element.querySelectorAll('button').length).to.equal(2);
  });

  it('calls dispatchCloseExternalResourceWizard and dispatchClearFormValues on cancel button click',
    function() {
    var spy = sinon.spy();
    var element = renderPureComponentWithStore(Footer(getProps(
      { dispatchCloseExternalResourceWizard: spy, dispatchClearFormValues: spy }
    )));
    TestUtils.Simulate.click(element.querySelector('button.cancel-button'));
    expect(spy).to.have.been.calledTwice;
  });

  it('calls onSelect on select button click', function() {
    var spy = sinon.spy();
    var element = renderPureComponentWithStore(Footer(getProps({ onSelect: spy })));
    TestUtils.Simulate.click(element.querySelector('button.select-button'));
    expect(spy).to.have.been.called;
  });

  it('disables the select button when selectIsDisabled is true', function() {
    var element = renderPureComponentWithStore(Footer(getProps({ selectIsDisabled: true })));
    expect(element.querySelector('button.select-button[disabled]')).to.exist;
  });
});
