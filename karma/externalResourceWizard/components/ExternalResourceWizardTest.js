import { ExternalResourceWizard } from 'components/ExternalResourceWizard';

describe('components/ExternalResourceWizard', function() {
  function defaultProps() {
    return {
      modalIsOpen: true,
      onClose: _.noop,
      onSelect: _.noop
    };
  }

  function getProps(props = {}) {
    return {...defaultProps(), ...props};
  }

  // TODO: add tests

  describe('footer', function() {
    it('renders', function() {
      var element = renderComponent(ExternalResourceWizard, getProps());
      expect(element.querySelector('.modal-footer')).to.exist;
    });

    it('has two buttons', function() {
      var element = renderComponent(ExternalResourceWizard, getProps());
      expect(element.querySelector('.modal-footer').querySelectorAll('button').length).to.equal(2);
    });

    it('calls onClose on cancel button click', function() {
      var spy = sinon.spy();
      var element = renderComponent(ExternalResourceWizard, getProps({ onClose: spy }));
      TestUtils.Simulate.click(element.querySelector('.modal-footer').querySelector('button.cancel-button'));
      expect(spy).to.have.been.called;
    });

    it('does not call onSelect on select button click if the form is invalid', function() {
      var spy = sinon.spy();
      var element = renderComponent(ExternalResourceWizard, getProps({ onSelect: spy }));
      TestUtils.Simulate.click(element.querySelector('.modal-footer').querySelector('button.select-button'));
      expect(spy).to.not.have.been.called;
    });

    it('calls onSelect on select button click if the form is valid', function() {
      var spy = sinon.spy();
      var element = renderComponent(ExternalResourceWizard, getProps({ onSelect: spy }));
      // Enter text in the Title and Url fields to make the form valid
      TestUtils.Simulate.change(element.querySelector('input.title'),
        { target: { value: 'test title' } });
      TestUtils.Simulate.change(element.querySelector('input.url'),
        { target: { value: 'http://test.com' } });
      TestUtils.Simulate.click(element.querySelector('.modal-footer').querySelector('button.select-button'));
      expect(spy).to.have.been.called;
    });
  });
});
