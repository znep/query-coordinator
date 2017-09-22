import sinon from 'sinon';
import { expect, assert } from 'chai';
import { StoryForm } from 'components/FeaturedContentModal/StoryForm';
import { Simulate } from 'react-dom/test-utils';

describe('components/FeaturedContentModal/StoryForm', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      canSave: true,
      createdAt: '2016-06-08T12:52:10.000-07:00',
      description: 'Daphne and Josephine',
      hasSaveError: false,
      hasValidationError: false,
      isLoadingStory: false,
      isSaved: false,
      isSaving: false,
      loadRequestedStory: _.noop,
      onChangeUrl: _.noop,
      onClickCancel: _.noop,
      onClickSave: _.noop,
      resetFocus: _.noop,
      shouldLoadStory: true,
      title: 'Sweet Sue and Her Society Syncopators',
      url: 'http://giraffes-in-spats.com/stories/s/nobodys-perfect/abcd-1234',
      viewCount: 0
    });
  }

  it('renders', function() {
    var element = renderComponent(StoryForm, getProps());
    assert.ok(element);
  });

  describe('markup', function() {
    var element;

    beforeEach(function() {
      element = renderComponent(StoryForm, getProps());
    });

    it('renders a form', function() {
      assert.ok(element.querySelector('form'));
    });

    it('renders a labelled input field', function() {
      assert.ok(element.querySelector('label#story-url-label'));
      assert.ok(element.querySelector('input#story-url'));
    });

    it('renders a back button', function() {
      assert.ok(element.querySelector('.back-button'));
    });

    describe('preview card', function() {
      it('renders', function() {
        assert.ok(element.querySelector('.view-card'));
      });

      it('renders the title', function() {
        var title = element.querySelector('.view-card .entry-title');
        expect(title.innerText).to.match(/Sweet Sue/);
      });

      it('renders the date', function() {
        var date = element.querySelector('.view-card .date');
        expect(date.innerText).to.eq('June 8, 2016');
      });

      it('renders the description', function() {
        var description = element.querySelector('.view-card .entry-description');
        expect(description.innerText).to.match(/Daphne/);
      });
    });
  });

  describe('interacting with input field', function() {
    it('invokes an onChange handler when the text field is modified', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        onChangeUrl: spy
      }));

      var field = element.querySelector('input');
      field.value = 'Bashful Dinosaurs';
      Simulate.change(field);

      sinon.assert.called(spy);
    });

    it('disables the save button if the form can not be saved', function() {
      var element = renderComponent(StoryForm, getProps({
        canSave: false
      }));

      assert.isTrue($(element).find('.save-button').prop('disabled'));
    });

    it('enables the save button if the form can be saved', function() {
      var element = renderComponent(StoryForm, getProps({
        canSave: true
      }));

      assert.isFalse($(element).find('.save-button').prop('disabled'));
    });

    it('displays a warning message when there is a validation error', function() {
      var element = renderComponent(StoryForm, getProps({
        hasValidationError: true
      }));
      var warning = element.querySelector('.alert.warning')

      assert.ok(warning);
      expect(warning.innerText).to.eq(I18n.featured_content_modal.story_form.invalid_url_message);
    });

    it('does not invoke loadRequestedStory when it should not load the story', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        loadRequestedStory: spy,
        shouldLoadStory: false
      }));

      sinon.assert.notCalled(spy);
    });

    it('invokes loadRequestedStory when it should load the story', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        loadRequestedStory: spy,
        shouldLoadStory: true
      }));

      sinon.assert.called(spy);
    });
  });

  describe('clicking action buttons', function() {
    it('invokes onClickCancel when clicking the back button', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        onClickCancel: spy
      }));

      Simulate.click(element.querySelector('.back-button'));

      sinon.assert.called(spy);
    });

    it('invokes onClickCancel when clicking the cancel button', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        onClickCancel: spy
      }));

      Simulate.click(element.querySelector('.cancel-button'));

      sinon.assert.called(spy);
    });

    it('invokes onClickSave when clicking the save button', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        onClickSave: spy
      }));

      Simulate.click(element.querySelector('.save-button'));

      sinon.assert.called(spy);
    });

    it('displays an error message if hasSaveError is true', function() {
      var element = renderComponent(StoryForm, getProps({
        hasSaveError: true
      }));

      assert.ok(element.querySelector('.alert.error'));
    });
  });
});
