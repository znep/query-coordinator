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

  it('renders the modal with a header, content, and footer', function() {
    var element = renderComponent(ExternalResourceWizard, getProps());
    expect(element.className).to.match(/external-resource-wizard/);
    expect(element.className).to.match(/modal/);
    expect(element.querySelector('.modal-header')).to.exist;
    expect(element.querySelector('.modal-content')).to.exist;
    expect(element.querySelector('.modal-footer')).to.exist;
  });

  describe('ModalHeader', function() {
    it('calls onClose on X button click', function() {
      var spy = sinon.spy();
      var element = renderComponent(ExternalResourceWizard, getProps({ onClose: spy }));
      TestUtils.Simulate.click(element.querySelector('.modal-header').
        querySelector('button.modal-header-dismiss'));
      expect(spy).to.have.been.called;
    });
  });

  describe('ModalContent', function() {
    it('calls onClose on back button click', function() {
      var spy = sinon.spy();
      var element = renderComponent(ExternalResourceWizard, getProps({ onClose: spy }));
      TestUtils.Simulate.click(element.querySelector('.modal-content').querySelector('button.back-button'));
      expect(spy).to.have.been.called;
    });

    describe('preview card', function() {
      it('updates its name and description when the form fields are changed', function() {
        var element = renderComponent(ExternalResourceWizard, getProps());
        var previewCard = element.querySelector('.external-resource-preview').querySelector('.result-card');

        TestUtils.Simulate.change(element.querySelector('input.title'),
          { target: { value: 'test title' } });
        expect(previewCard.querySelector('.entry-title').textContent).to.eq('test title');

        TestUtils.Simulate.change(element.querySelector('input.description'),
          { target: { value: 'some description' } });
        expect(previewCard.querySelector('.entry-description').textContent).to.eq('some description');
      });
    });
  });

  describe('ModalFooter', function() {
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
