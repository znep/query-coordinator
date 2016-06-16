import { StoryForm } from 'components/FeaturedContentModal/StoryForm';
import { Simulate } from 'react-addons-test-utils';

describe('components/FeaturedContentModal/StoryForm', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      canSave: true,
      createdAt: '2016-06-08T15:52:10.000-07:00',
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
      shouldLoadStory: true,
      title: 'Sweet Sue and Her Society Syncopators',
      url: 'http://giraffes-in-spats.com/stories/s/nobodys-perfect/abcd-1234',
      viewCount: 0
    });
  }

  it('renders', function() {
    var element = renderComponent(StoryForm, getProps());
    expect(element).to.exist;
  });

  describe('markup', function() {
    var element;

    beforeEach(function() {
      element = renderComponent(StoryForm, getProps());
    });

    it('renders a form', function() {
      expect(element.querySelector('form')).to.exist;
    });

    it('renders a labelled input field', function() {
      expect(element.querySelector('label#story-url-label')).to.exist;
      expect(element.querySelector('input#story-url')).to.exist;
    });

    it('renders a back button', function() {
      expect(element.querySelector('.back-button')).to.exist;
    });

    describe('preview widget', function() {
      it('renders', function() {
        expect(element.querySelector('.view-widget')).to.exist;
      });

      it('renders the title', function() {
        var title = element.querySelector('.view-widget .entry-title');
        expect(title.innerText).to.match(/Sweet Sue/);
      });

      it('renders the date', function() {
        var date = element.querySelector('.view-widget .date');
        expect(date.innerText).to.eq('June 8, 2016');
      });

      it('renders the description', function() {
        var description = element.querySelector('.view-widget .entry-description');
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

      expect(spy).to.have.been.called;
    });

    it('disables the save button if the form can not be saved', function() {
      var element = renderComponent(StoryForm, getProps({
        canSave: false
      }));

      expect(element.querySelector('.save-button')).to.be.disabled;
    });

    it('enables the save button if the form can be saved', function() {
      var element = renderComponent(StoryForm, getProps({
        canSave: true
      }));

      expect(element.querySelector('.save-button')).to.not.be.disabled;
    });

    it('displays a warning message when there is a validation error', function() {
      var element = renderComponent(StoryForm, getProps({
        hasValidationError: true
      }));
      var warning = element.querySelector('.alert.warning')

      expect(warning).to.exist;
      expect(warning.innerText).to.eq(I18n.featured_content_modal.story_form.invalid_url_message);
    });

    it('does not invoke loadRequestedStory when it should not load the story', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        loadRequestedStory: spy,
        shouldLoadStory: false
      }));

      expect(spy).to.not.have.been.called;
    });

    it('invokes loadRequestedStory when it should load the story', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        loadRequestedStory: spy,
        shouldLoadStory: true
      }));

      expect(spy).to.have.been.called;
    });
  });

  describe('clicking action buttons', function() {
    it('invokes onClickCancel when clicking the back button', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        onClickCancel: spy
      }));

      Simulate.click(element.querySelector('.back-button'));

      expect(spy).to.have.been.called;
    });

    it('invokes onClickCancel when clicking the cancel button', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        onClickCancel: spy
      }));

      Simulate.click(element.querySelector('.cancel-button'));

      expect(spy).to.have.been.called;
    });

    it('invokes onClickSave when clicking the save button', function() {
      var spy = sinon.spy();
      var element = renderComponent(StoryForm, getProps({
        onClickSave: spy
      }));

      Simulate.click(element.querySelector('.save-button'));

      expect(spy).to.have.been.called;
    });

    it('displays an error message if hasSaveError is true', function() {
      var element = renderComponent(StoryForm, getProps({
        hasSaveError: true
      }));

      expect(element.querySelector('.alert.error')).to.exist;
    });
  });
});
