import sinon from 'sinon';
import { expect, assert } from 'chai';
import { ExternalResourceEditor } from 'components/ExternalResourceEditor';

describe('ExternalResourceEditor', () => {
  function defaultProps() {
    return {
      modalIsOpen: true,
      onBack: _.noop,
      onClose: _.noop,
      onSelect: _.noop
    };
  }

  function getProps(props = {}) {
    return {...defaultProps(), ...props};
  }

  it('renders the modal with a header, content, and footer', () => {
    const element = renderComponent(ExternalResourceEditor, getProps());
    assert.match(element.className, /external-resource-editor/);
    assert.match(element.className, /modal/);
    assert.isNotNull(element.querySelector('.modal-header'));
    assert.isNotNull(element.querySelector('.modal-content'));
    assert.isNotNull(element.querySelector('.modal-footer'));
  });

  describe('ModalHeader', () => {
    it('calls onClose on X button click', () => {
      const spy = sinon.spy();
      const element = renderComponent(ExternalResourceEditor, getProps({ onClose: spy }));
      TestUtils.Simulate.click(element.querySelector('.modal-header').
        querySelector('button.modal-header-dismiss'));
      sinon.assert.called(spy);
    });
  });

  describe('ModalContent', () => {
    it('calls onBack on back button click', () => {
      const spy = sinon.spy();
      const element = renderComponent(ExternalResourceEditor, getProps({ onBack: spy }));
      TestUtils.Simulate.click(element.querySelector('.modal-content').querySelector('button.back-button'));
      sinon.assert.called(spy);
    });

    describe('preview card', () => {
      it('updates its name and description when the form fields are changed', () => {
        const element = renderComponent(ExternalResourceEditor, getProps());
        const previewCard = element.querySelector('.external-resource-preview').querySelector('.result-card');

        TestUtils.Simulate.change(element.querySelector('input.title'),
          { target: { value: 'test title' } });
        assert.equal(previewCard.querySelector('.entry-title').textContent, 'test title');

        TestUtils.Simulate.change(element.querySelector('input.description'),
          { target: { value: 'some description' } });
        assert.equal(previewCard.querySelector('.entry-description').textContent, 'some description');
      });
    });
  });

  describe('ModalFooter', () => {
    it('has two buttons', () => {
      const element = renderComponent(ExternalResourceEditor, getProps());
      assert.equal(element.querySelector('.modal-footer').querySelectorAll('button').length, 2);
    });

    it('calls onClose on cancel button click', () => {
      const spy = sinon.spy();
      const element = renderComponent(ExternalResourceEditor, getProps({ onClose: spy }));
      const cancelButton = element.querySelector('.modal-footer').querySelector('button.cancel-button');

      TestUtils.Simulate.click(cancelButton);
      sinon.assert.called(spy);
    });

    it('does not call onSelect on select button click if the title is invalid', () => {
      const spy = sinon.spy();
      const element = renderComponent(ExternalResourceEditor, getProps({ onSelect: spy }));
      const selectButton = element.querySelector('.modal-footer').querySelector('button.select-button');

      TestUtils.Simulate.change(element.querySelector('input.title'),
        { target: { value: '' } });
      TestUtils.Simulate.change(element.querySelector('input.url'),
        { target: { value: 'http://test.com' } });
      TestUtils.Simulate.click(selectButton);
      sinon.assert.notCalled(spy);
    });

    it('does not call onSelect on select button click if the url is empty', () => {
      const spy = sinon.spy();
      const element = renderComponent(ExternalResourceEditor, getProps({ onSelect: spy }));
      const selectButton = element.querySelector('.modal-footer').querySelector('button.select-button');

      TestUtils.Simulate.change(element.querySelector('input.title'),
        { target: { value: 'test title' } });

      TestUtils.Simulate.change(element.querySelector('input.url'),
        { target: { value: '' } });
      TestUtils.Simulate.click(selectButton);

      sinon.assert.notCalled(spy);
    });

    it('does not call onSelect on select button click if the url is invalid', () => {
      // URLs are invalid if they don't start with http(s)://
      const spy = sinon.spy();
      const element = renderComponent(ExternalResourceEditor, getProps({ onSelect: spy }));
      const selectButton = element.querySelector('.modal-footer').querySelector('button.select-button');

      TestUtils.Simulate.change(element.querySelector('input.title'),
        { target: { value: 'test title' } });

      TestUtils.Simulate.change(element.querySelector('input.url'),
        { target: { value: 'test.com' } });
      TestUtils.Simulate.click(selectButton);

      TestUtils.Simulate.change(element.querySelector('input.url'),
        { target: { value: 'www.test.com' } });
      TestUtils.Simulate.click(selectButton);

      sinon.assert.notCalled(spy);
    });

    it('calls onSelect on select button click if the form is valid', () => {
      const spy = sinon.spy();
      const element = renderComponent(ExternalResourceEditor, getProps({ onSelect: spy }));
      const selectButton = element.querySelector('.modal-footer').querySelector('button.select-button');
      // Enter text in both the Title and Url fields to make the form valid.
      TestUtils.Simulate.change(element.querySelector('input.title'),
        { target: { value: 'test title' } });

      // URLs are valid if they are prepended with `http(s)://`.
      TestUtils.Simulate.change(element.querySelector('input.url'),
        { target: { value: 'http://test.com' } });
      TestUtils.Simulate.click(selectButton);

      TestUtils.Simulate.change(element.querySelector('input.url'),
        { target: { value: 'https://test.com' } });
      TestUtils.Simulate.click(selectButton);

      sinon.assert.calledTwice(spy);
    });
  });
});
