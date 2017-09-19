import sinon from 'sinon';
import { expect, assert } from 'chai';
import { ExternalResourceForm } from 'components/FeaturedContentModal/ExternalResourceForm';
import { Simulate } from 'react-dom/test-utils';

describe('components/FeaturedContentModal/ExternalResourceForm', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      title: 'blueberry smoothie',
      description: 'glorious purple goop',
      resetFocus: _.noop,
      url: 'http://thepurplestore.com'
    });
  }

  it('renders something', function() {
    var element = renderComponent(ExternalResourceForm, getProps());
    assert.ok(element);
  });

  describe('markup', function() {
    var element;

    beforeEach(function() {
      element = renderComponent(ExternalResourceForm, getProps());
    });

    it('renders a back button', function() {
      assert.ok(element.querySelector('.modal-content .back-button'));
    });

    it('renders the header', function() {
      assert.ok(element.querySelector('.modal-content h2'));
    });

    it('renders the prompt', function() {
      assert.ok(element.querySelector('.modal-content p'));
    });

    it('renders the form container', function() {
      assert.ok(element.querySelector('.external-resource-contents'));
    });

    it('renders the title input', function() {
      var titleInput = element.querySelector('#external-resource-title');
      assert.ok(titleInput);
      expect(titleInput.value).to.equal('blueberry smoothie');
    });

    it('renders the description input', function() {
      var descriptionInput = element.querySelector('#external-resource-description');
      assert.ok(descriptionInput);
      expect(descriptionInput.value).to.equal('glorious purple goop');
    });

    it('renders the url input', function() {
      var urlInput = element.querySelector('#external-resource-url');
      assert.ok(urlInput);
      expect(urlInput.value).to.equal('http://thepurplestore.com');
    });
  });

  describe('validation', function() {
    it('disables the save button if canSave is false', function() {
      var element = renderComponent(ExternalResourceForm, getProps({ canSave: false }));
      var saveButton = element.querySelector('button.save-button');
      expect(saveButton.disabled).to.equal(true);
    });

    it('enables the save button if canSave is true', function() {
      var element = renderComponent(ExternalResourceForm, getProps({ canSave: true }));
      var saveButton = element.querySelector('button.save-button');
      expect(saveButton.disabled).to.equal(false);
    });

    it('shows a url warning if the url is not valid', function() {
      var element = renderComponent(ExternalResourceForm, getProps({
        url: 'myspace'
      }));

      var urlWarning = element.querySelector('.alert.warning');
      assert.ok(urlWarning);
    });

    it('does not show a url warning if the url is valid', function() {
      var element = renderComponent(ExternalResourceForm, getProps({
        url: 'https://myspace.co.uk'
      }));

      var urlWarning = element.querySelector('.alert.warning');
      assert.isNull(urlWarning);
    });

    it('does not show a url warning if the url is blank', function() {
      var element = renderComponent(ExternalResourceForm, getProps({
        url: ''
      }));

      var urlWarning = element.querySelector('.alert.warning');
      assert.isNull(urlWarning);
    });

    it('renders an error if the save failed', function() {
      var element = renderComponent(ExternalResourceForm, getProps({ hasSaveError: true }));
      assert.ok(element.querySelector('.alert.error'));
    });

    it('does not render an error if the save did not fail', function() {
      var element = renderComponent(ExternalResourceForm, getProps({ hasSaveError: false }));
      assert.isNull(element.querySelector('.alert.error'));
    });
  });

  describe('footer', function() {
    it('exists', function() {
      var element = renderComponent(ExternalResourceForm, getProps());
      assert.ok(element.querySelector('footer'));
    });

    it('renders the save button', function() {
      var element = renderComponent(ExternalResourceForm, getProps());
      assert.ok(element.querySelector('.save-button'));
    });

    it('renders the save button with a spinner if the item is saving', function() {
      var element = renderComponent(ExternalResourceForm, getProps({ isSaving: true }));
      var saveButton = element.querySelector('.save-button');
      assert.ok(saveButton);
      assert.ok(saveButton.querySelector('.spinner-default'));
    });

    it('renders the save button in green if the page just saved', function() {
      var element = renderComponent(ExternalResourceForm, getProps({ isSaved: true }));
      var saveButton = element.querySelector('.save-button');
      assert.ok(saveButton);
      expect(saveButton.classList.contains('btn-success')).to.equal(true);
    });
  });

  describe('actions', function() {
    it('updates the title when the title value changes', function() {
      var spy = sinon.spy();
      var element = renderComponent(ExternalResourceForm, getProps({
        onChangeTitle: spy
      }));

      expect(spy.callCount).to.equal(0);
      Simulate.change(element.querySelector('#external-resource-title'), 'ugh');
      expect(spy.callCount).to.equal(1);
    });

    it('updates the description when the description value changes', function() {
      var spy = sinon.spy();
      var element = renderComponent(ExternalResourceForm, getProps({
        onChangeDescription: spy
      }));

      expect(spy.callCount).to.equal(0);
      Simulate.change(element.querySelector('#external-resource-description'), 'why');
      expect(spy.callCount).to.equal(1);
    });

    it('updates the url when the url value changes', function() {
      var spy = sinon.spy();
      var element = renderComponent(ExternalResourceForm, getProps({
        onChangeUrl: spy
      }));

      expect(spy.callCount).to.equal(0);
      Simulate.change(element.querySelector('#external-resource-url'), 'stop');
      expect(spy.callCount).to.equal(1);
    });

    it('calls onClickSave when you click save', function() {
      var spy = sinon.spy();
      var element = renderComponent(ExternalResourceForm, getProps({
        onClickSave: spy,
        canSave: true
      }));

      expect(spy.callCount).to.equal(0);
      Simulate.click(element.querySelector('.save-button'));
      expect(spy.callCount).to.equal(1);
    });

    it('calls onClickCancel when you click cancel', function() {
      var spy = sinon.spy();
      var element = renderComponent(ExternalResourceForm, getProps({
        onClickCancel: spy,
      }));

      expect(spy.callCount).to.equal(0);
      Simulate.click(element.querySelector('.cancel-button'));
      expect(spy.callCount).to.equal(1);
    });
  });
});
