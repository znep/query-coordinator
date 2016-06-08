import { ExternalResourceForm } from 'components/FeaturedContentModal/ExternalResourceForm';
import { Simulate } from 'react-addons-test-utils';

describe('components/FeaturedContentModal/ExternalResourceForm', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      title: 'blueberry smoothie',
      description: 'glorious purple goop',
      url: 'http://thepurplestore.com'
    });
  }

  it('renders something', function() {
    var element = renderComponent(ExternalResourceForm, getProps());
    expect(element).to.exist;
  });

  describe('markup', function() {
    var element;

    beforeEach(function() {
      element = renderComponent(ExternalResourceForm, getProps());
    });

    it('renders a back button', function() {
      expect(element.querySelector('.modal-content > .back-button')).to.exist;
    });

    it('renders the header', function() {
      expect(element.querySelector('.modal-content > h2')).to.exist;
    });

    it('renders the prompt', function() {
      expect(element.querySelector('.modal-content > p')).to.exist;
    });

    it('renders the form container', function() {
      expect(element.querySelector('.external-resource-contents')).to.exist;
    });

    it('renders the title input', function() {
      var titleInput = element.querySelector('#external-resource-title');
      expect(titleInput).to.exist;
      expect(titleInput.value).to.equal('blueberry smoothie');
    });

    it('renders the description input', function() {
      var descriptionInput = element.querySelector('#external-resource-description');
      expect(descriptionInput).to.exist;
      expect(descriptionInput.value).to.equal('glorious purple goop');
    });

    it('renders the url input', function() {
      var urlInput = element.querySelector('#external-resource-url');
      expect(urlInput).to.exist;
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
      expect(urlWarning).to.exist;
    });

    it('does not show a url warning if the url is valid', function() {
      var element = renderComponent(ExternalResourceForm, getProps({
        url: 'https://myspace.co.uk'
      }));

      var urlWarning = element.querySelector('.alert.warning');
      expect(urlWarning).to.not.exist;
    });

    it('does not show a url warning if the url is blank', function() {
      var element = renderComponent(ExternalResourceForm, getProps({
        url: ''
      }));

      var urlWarning = element.querySelector('.alert.warning');
      expect(urlWarning).to.not.exist;
    });

    it('renders an error if the save failed', function() {
      var element = renderComponent(ExternalResourceForm, getProps({ hasError: true }));
      expect(element.querySelector('.alert.error')).to.exist;
    });

    it('does not render an error if the save did not fail', function() {
      var element = renderComponent(ExternalResourceForm, getProps({ hasError: false }));
      expect(element.querySelector('.alert.error')).to.not.exist;
    });
  });

  describe('footer', function() {
    it('exists', function() {
      var element = renderComponent(ExternalResourceForm, getProps());
      expect(element.querySelector('footer')).to.exist;
    });

    it('renders the save button', function() {
      var element = renderComponent(ExternalResourceForm, getProps());
      expect(element.querySelector('.save-button')).to.exist;
    });

    it('renders the save button with a spinner if the item is saving', function() {
      var element = renderComponent(ExternalResourceForm, getProps({ isSaving: true }));
      var saveButton = element.querySelector('.save-button');
      expect(saveButton).to.exist;
      expect(saveButton.querySelector('.spinner-default')).to.exist;
    });

    it('renders the save button in green if the page just saved', function() {
      var element = renderComponent(ExternalResourceForm, getProps({ isSaved: true }));
      var saveButton = element.querySelector('.save-button');
      expect(saveButton).to.exist;
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
