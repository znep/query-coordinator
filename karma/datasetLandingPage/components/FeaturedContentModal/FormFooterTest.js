import FormFooter from 'components/FeaturedContentModal/FormFooter';
import { Simulate } from 'react-addons-test-utils';

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
    var element = renderPureComponent(FormFooter(getProps()));
    expect(element).to.exist;
  });

  describe('save button', function() {
    it('does not render if displaySaveButton is false', function() {
      var element = renderPureComponent(FormFooter(getProps({
        displaySaveButton: false
      })));
      expect(element.querySelector('button.save-button')).to.not.exist;
    });

    describe('when displaySaveButton is true', function() {
      it('renders', function() {
        var element = renderPureComponent(FormFooter(getProps()));
        expect(element.querySelector('button.save-button')).to.exist;
      });

      it('displays the saveText in the save button by default', function() {
        var element = renderPureComponent(FormFooter(getProps({
          saveText: 'Hot Potato'
        })));
        var saveButton = element.querySelector('button.save-button');
        expect(saveButton.innerText).to.eq('Hot Potato');
      });

      it('displays a spinner in the save button if isSaving is true', function() {
        var element = renderPureComponent(FormFooter(getProps({
          isSaving: true
        })));
        var saveButtonSpinner = element.querySelector('button.save-button .spinner-default');
        expect(saveButtonSpinner).to.exist;
      });

      it('displays the savedText in the save button if isSaved is true', function() {
        var element = renderPureComponent(FormFooter(getProps({
          isSaved: true,
          savedText: 'Buoyant Bears'
        })));
        var saveButton = element.querySelector('button.save-button');
        expect(saveButton.innerText).to.eq('Buoyant Bears');
      });

      it('is disabled when isSaving is true', function() {
        var element = renderPureComponent(FormFooter(getProps({
          isSaving: true
        })));
        var saveButton = element.querySelector('button.save-button');
        expect(saveButton).to.be.disabled;
      });

      it('is disabled when canSave is false', function() {
        var element = renderPureComponent(FormFooter(getProps({
          canSave: false
        })));
        var saveButton = element.querySelector('button.save-button');
        expect(saveButton).to.be.disabled;
      });

      it('invokes onClickSave on click', function() {
        var spy = sinon.spy();
        var element = renderPureComponent(FormFooter(getProps({
          onClickSave: spy
        })));
        var saveButton = element.querySelector('button.save-button');

        Simulate.click(saveButton);
        expect(spy).to.have.been.called;
      });
    });
  });

  describe('cancel button', function() {
    it('renders', function() {
      var element = renderPureComponent(FormFooter(getProps()));
      expect(element.querySelector('button.cancel-button')).to.exist;
    });

    it('displays te cancelText in the cancel button', function() {
      var element = renderPureComponent(FormFooter(getProps({
        cancelText: 'Flexible Bicycles'
      })));
      var cancelButton = element.querySelector('button.cancel-button')
      expect(cancelButton.innerText).to.equal('Flexible Bicycles');
    });

    it('invokes onClickCancel on click', function() {
      var spy = sinon.spy();
      var element = renderPureComponent(FormFooter(getProps({
        onClickCancel: spy
      })));
      var cancelButton = element.querySelector('button.cancel-button')

      Simulate.click(cancelButton);
      expect(spy).to.have.been.called;
    });
  });
});
