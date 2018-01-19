import sinon from 'sinon';
import { assert } from 'chai';
import Immutable from 'immutable';
import moment from 'moment';
import translations from 'mockTranslations';
import { goalsWithPublicationState } from '../../../data/goalTableActions/propGoals';
import EditGeneral from 'adminGoals/sections/goals/components/QuickEditForm/EditGeneral';
import { shallow } from 'enzyme';

describe('sections/goals/components/QuickEditForm/EditGeneral', () => {
  let goal;
  let output;

  const noDraftMessageSelector = '.visibility-status .no-draft-message';
  const visibilityDropdownSelector = '.visibility-status Select';
  const itRendersEditablePublicationStatus = () => {
    it('renders editable publication status', () => {
      assert.lengthOf(output.find(visibilityDropdownSelector), 1);
      assert.lengthOf(output.find(noDraftMessageSelector), 0);
    });
  };

  const itRendersReadonlyPublicationStatus = () => {
    it('renders readonly publication status', () => {
      assert.lengthOf(output.find(visibilityDropdownSelector), 0);
      assert.lengthOf(output.find(noDraftMessageSelector), 1);
    });
  };

  const render = (goalToRender, propOverrides) => {
    const props = _.merge(
      {},
      {
        goal: Immutable.fromJS(goalToRender),
        goalPublicationStatus: 'status_private',
        saveInProgress: false,
        formData: Immutable.fromJS({
          visibility: 'private',
          name: goalToRender.name
        }),
        translations: Immutable.fromJS(translations),
        usingStorytellerEditor: true
      },
      propOverrides
    );

    return shallow(React.createElement(EditGeneral.WrappedComponent, props));
  };

  describe('not using storyteller', () => {
    beforeEach(() => {
      output = render(goalsWithPublicationState.neverPublished, {
        usingStorytellerEditor: false
      });
    });

    it('does not render publication warning', () => {
      assert.lengthOf(output.find('.will-publish-notice'), 0);
    });

    it('does not render draft status', () => {
      assert.lengthOf(output.find('.draft-status'), 0);
    });

    itRendersEditablePublicationStatus();
  });

  describe('using storyteller', () => {
    beforeEach(() => {
      output = render(goalsWithPublicationState.neverPublished);
    });

    it('renders publication warning', () => {
      assert.lengthOf(output.find('.will-publish-notice'), 1);
    });

    it('renders draft status', () => {
      assert.lengthOf(output.find('.draft-status'), 1);
    });
  });

  // Rest of tests assume storyteller is enabled.

  const spinnerSelector = '.draft-status .spinner-default';
  const publishLinkSelector = '.draft-status a[role="button"]';
  const itShowsDraftPublicationDate = () => {
    it('shows the draft publication date', () => {
      assert.property(goal.narrative.draft, 'created_at');
      assert.include(
        output.find('.draft-status').text(), moment(goal.narrative.draft.created_at).format('ll')
      );
    });
  };

  const itHidesDraftPublicationDate = () => {
    it('hides the draft publication date', () => {
      assert.include(
        output.find('.draft-status').text(), 'No saved drafts.'
      );
    });
  };

  const itShowsSpinner = () => {
    it('shows spinner', () => {
      assert.lengthOf(output.find(spinnerSelector), 1);
    });
  };

  const itHidesSpinner = () => {
    it('hides spinner', () => {
      assert.lengthOf(output.find(spinnerSelector), 0);
    });
  };

  const itHidesPublishedMessage = () => {
    it('hides published message', () => {
      assert.notInclude(
        output.find('.draft-status').text(), '(published)'
      );
    });
  };

  const itShowsPublishedMessage = () => {
    it('shows published message', () => {
      assert.include(
        output.find('.draft-status').text(), '(published)'
      );
    });
  };

  const itHidesPublishLink = () => {
    it('hides publish link', () => {
      assert.lengthOf(output.find(publishLinkSelector), 0);
    });
  };

  describe('publishedWithDraft idle', () => {
    let publishLatestDraft;
    beforeEach(() => {
      goal = goalsWithPublicationState.publishedWithDraft;
      publishLatestDraft = sinon.stub();
      output = render(goal, {
        publishLatestDraft,
        goalPublicationStatus: 'status_public_with_draft'
      });
    });

    describe('the publish link', () => {
      it('is visible', () => {
        assert.lengthOf(output.find(publishLinkSelector), 1);
      });

      it('works', () => {
        const preventDefault = sinon.stub();
        output.find(publishLinkSelector).simulate('click', {
          preventDefault
        });
        sinon.assert.calledOnce(publishLatestDraft);
        sinon.assert.calledOnce(preventDefault);
      });
    });

    itShowsDraftPublicationDate();
    itHidesSpinner();
    itHidesPublishedMessage();
    itRendersEditablePublicationStatus();
  });

  describe('publishedWithDraft saving', () => {
    let publishLatestDraft;
    beforeEach(() => {
      goal = goalsWithPublicationState.publishedWithDraft;
      publishLatestDraft = sinon.stub();
      output = render(goal, {
        publishLatestDraft,
        saveInProgress: true,
        goalPublicationStatus: 'status_public_with_draft'
      });
    });

    itShowsDraftPublicationDate();
    itShowsSpinner();
    itHidesPublishLink();
    itHidesPublishedMessage();
    itRendersEditablePublicationStatus();
  });

  describe('published idle', () => {
    beforeEach(() => {
      goal = goalsWithPublicationState.published;
      output = render(goal, {
        goalPublicationStatus: 'status_public'
      });
    });

    itShowsDraftPublicationDate();
    itShowsPublishedMessage();
    itHidesPublishLink();
    itHidesSpinner();
    itRendersEditablePublicationStatus();
  });

  describe('private never published idle', () => {
    beforeEach(() => {
      goal = goalsWithPublicationState.neverPublished;
      output = render(goal, {
        goalPublicationStatus: 'status_private'
      });
    });

    itShowsDraftPublicationDate();
    itHidesSpinner();
    itHidesPublishLink();
    itHidesPublishedMessage();
    itRendersEditablePublicationStatus();
  });

  describe('private unpublished idle', () => {
    beforeEach(() => {
      goal = goalsWithPublicationState.unpublished;
      output = render(goal, {
        goalPublicationStatus: 'status_private'
      });
    });

    itShowsDraftPublicationDate();
    itHidesSpinner();
    itHidesPublishLink();
    itHidesPublishedMessage();
    itRendersEditablePublicationStatus();
  });

  describe('private never edited', () => {
    beforeEach(() => {
      goal = goalsWithPublicationState.neverEdited;
      output = render(goal, {
        goalPublicationStatus: 'status_private'
      });
    });

    itHidesDraftPublicationDate();
    itHidesSpinner();
    itHidesPublishLink();
    itHidesPublishedMessage();
    itRendersReadonlyPublicationStatus();
  });
});
