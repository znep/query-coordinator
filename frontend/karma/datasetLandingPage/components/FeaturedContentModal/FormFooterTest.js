import sinon from 'sinon';
import { expect, assert } from 'chai';
import FormFooter from 'datasetLandingPage/components/FeaturedContentModal/FormFooter';
import { Simulate } from 'react-dom/test-utils';

describe('components/FeaturedContentModal/FormFooter', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      cancelText: 'Cancel',
      canSave: true,
      displaySaveButton: true,
      isSaved: false,
      isSaving: false,
      onClickCancel: _.noop,
      onClickSave: _.noop,
      saveText: 'Save',
      savedText: 'Saved!'
    });
  }

  it('renders', function() {
    var element = renderComponent(FormFooter, getProps());
    assert.ok(element);
  });

  describe('save button', function() {
    it('does not render if displaySaveButton is false', function() {
      var element = renderComponent(FormFooter, getProps({
        displaySaveButton: false
      }));
      assert.isNull(element.querySelector('button.save-button'));
    });

    describe('when displaySaveButton is true', function() {
      it('renders', function() {
        var element = renderComponent(FormFooter, getProps());
        assert.ok(element.querySelector('button.save-button'));
      });

      it('displays the saveText in the save button by default', function() {
        var element = renderComponent(FormFooter, getProps({
          saveText: 'Hot Potato'
        }));
        var saveButton = element.querySelector('button.save-button');
        expect(saveButton.innerText).to.eq('Hot Potato');
      });

      it('displays a spinner in the save button if isSaving is true', function() {
        var element = renderComponent(FormFooter, getProps({
          isSaving: true
        }));
        var saveButtonSpinner = element.querySelector('button.save-button .spinner-default');
        assert.ok(saveButtonSpinner);
      });

      it('displays the savedText in the save button if isSaved is true', function() {
        var element = renderComponent(FormFooter, getProps({
          isSaved: true,
          savedText: 'Buoyant Bears'
        }));
        var saveButton = element.querySelector('button.save-button');
        expect(saveButton.innerText).to.eq('Buoyant Bears');
      });

      it('is disabled when isSaving is true', function() {
        var element = renderComponent(FormFooter, getProps({
          isSaving: true
        }));
        var saveButton = element.querySelector('button.save-button');
        assert.isTrue($(saveButton).prop('disabled'));
      });

      it('is disabled when canSave is false', function() {
        var element = renderComponent(FormFooter, getProps({
          canSave: false
        }));
        var saveButton = element.querySelector('button.save-button');
        assert.isTrue($(saveButton).prop('disabled'));
      });

      it('invokes onClickSave on click', function() {
        var spy = sinon.spy();
        var element = renderComponent(FormFooter, getProps({
          onClickSave: spy
        }));
        var saveButton = element.querySelector('button.save-button');

        Simulate.click(saveButton);
        sinon.assert.called(spy);
      });
    });
  });

  describe('cancel button', function() {
    it('renders', function() {
      var element = renderComponent(FormFooter, getProps());
      assert.ok(element.querySelector('button.cancel-button'));
    });

    it('displays te cancelText in the cancel button', function() {
      var element = renderComponent(FormFooter, getProps({
        cancelText: 'Flexible Bicycles'
      }));
      var cancelButton = element.querySelector('button.cancel-button')
      expect(cancelButton.innerText).to.equal('Flexible Bicycles');
    });

    it('invokes onClickCancel on click', function() {
      var spy = sinon.spy();
      var element = renderComponent(FormFooter, getProps({
        onClickCancel: spy
      }));
      var cancelButton = element.querySelector('button.cancel-button')

      Simulate.click(cancelButton);
      sinon.assert.called(spy);
    });
  });
});
