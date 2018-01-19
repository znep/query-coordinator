import _ from 'lodash';
import { assert } from 'chai';
import Immutable from 'immutable';
import translations from 'mockTranslations';
import BulkEditForm from 'adminGoals/sections/goals/components/BulkEditForm/BulkEditForm';
import { shallow } from 'enzyme';

//TODO: Test redux connectors.

describe('sections/goals/components/BulkEditForm/BulkEditForm', () => {
  let output;

  const render = (propOverrides) => {
    const props = _.merge(
      {},
      {
        goal: {},
        publishingAction: null,
        selectedGoals: [],
        goalSelectionCount: 0,
        publishDisabledBecauseMissingDrafts: false,
        usavedChanges: false,
        commonData: {
          prevailing_measure: {}
        },
        saveStatus: {},
        usingStorytellerEditor: true,
        translations: Immutable.fromJS(translations),
        areAllSelectedGoalsConfigured: true,
        draftlessSelectedGoals: [],
        unconfiguredSelectedGoals: [],

        bulkEditActions: {},
        notificationActions: {},
        dismissModal: _.noop
      },
      propOverrides
    );

    return shallow(React.createElement(BulkEditForm.WrappedComponent, props)).dive();
  };

  const itShowsFullFooter = () => {
    it('shows one button in the footer', () => {
      assert.lengthOf(output.find('Footer Button'), 2);
    });
  };

  const itShowsCloseOnlyFooter = () => {
    it('shows one button in the footer', () => {
      assert.lengthOf(output.find('Footer Button'), 1);
    });
  };

  const itHidesFooter = () => {
    it('has no footer', () => {
      assert.lengthOf(output.find('Footer'), 0);
    });
  };

  const itShowsClose = () => {
    it('shows the modal X', () => {
      assert.isFunction(output.find('Header').props().onClose);
    });
  };

  const itHidesClose = () => {
    it('hides the modal X', () => {
      assert.isNotFunction(output.find('Header').props().onClose);
    });
  };

  describe('not all goals configured', () => {
    beforeEach(() => {
      output = render({
        areAllSelectedGoalsConfigured: false
      });
    });

    itShowsCloseOnlyFooter();
    itShowsClose();

    it('shows goal config warning', () => {
      assert.lengthOf(output.find('.unconfigured-goal-warning'), 1);
    });
  });

  describe('error', () => {
    beforeEach(() => {
      output = render({
        saveStatus: {
          error: true
        }
      });
    });

    it('shows error', () => {
      assert.lengthOf(output.find('SocrataAlert[type="error"]'), 1);
    });

    itShowsCloseOnlyFooter();
    itShowsClose();
  });

  describe('in progress', () => {
    beforeEach(() => {
      output = render({
        saveStatus: {
          inProgress: true
        }
      });
    });

    it('shows progress component', () => {
      assert.lengthOf(output.find('Connect(BulkEditSaveProgress)'), 1);
    });

    itHidesFooter();
    itHidesClose();
  });

  describe('main editing screen', () => {
    beforeEach(() => {
      output = render({
      });
    });

    it('shows the publishing action dropdown', () => {
      assert.lengthOf(output.find('.publishing-action-select'), 1);
    });

    itShowsFullFooter();
    itShowsClose();
  });

  describe('publishing action dropdown', () => {
    const getProvidedOptions = (props) => {
      output = render(props);
      return _.map(
        output.find('.publishing-action-select').props().options,
        'value'
      );
    };

    const itShowsOptions = (props, optionsList) => {
      it(`shows options: ${optionsList.join()}`, () => {
        assert.deepEqual(
          getProvidedOptions(props).sort(),
          optionsList.sort()
        );
      });
    };

    describe('classic editor mode', () => {
      describe('all private goals', () => {
        itShowsOptions(
          {
            usingStorytellerEditor: false,
            goalSelectionCount: {
              status_private: 2,
              status_public: 0
            }
          },
          [ 'make_public_classic_editor' ]
        );
      });

      describe('all public goals', () => {
        itShowsOptions(
          {
            usingStorytellerEditor: false,
            goalSelectionCount: {
              status_private: 0,
              status_public: 2
            }
          },
          [ 'make_private' ]
        );
      });

      describe('some public, some private', () => {
        itShowsOptions(
          {
            usingStorytellerEditor: false,
            goalSelectionCount: {
              status_private: 2,
              status_public: 2
            }
          },
          [ 'make_private', 'make_public_classic_editor' ]
        );
      });
    });

    describe('storyteller mode', () => {
      describe('all private goals', () => {
        itShowsOptions(
          {
            goalSelectionCount: {
              status_private: 2,
              status_public: 0,
              status_public_with_draft: 0
            }
          },
          [ 'publish_latest_draft' ]
        );
      });

      describe('all public goals', () => {
        itShowsOptions(
          {
            goalSelectionCount: {
              status_private: 0,
              status_public: 2,
              status_public_with_draft: 0
            }
          },
          [ 'make_private' ]
        );
      });

      describe('some public with draft, some public, some private', () => {
        itShowsOptions(
          {
            goalSelectionCount: {
              status_private: 2,
              status_public: 2,
              status_public_with_draft: 2
            }
          },
          [ 'make_private', 'publish_latest_draft' ]
        );
      });

      describe('some public with draft, some private', () => {
        itShowsOptions(
          {
            goalSelectionCount: {
              status_private: 2,
              status_public: 0,
              status_public_with_draft: 2
            }
          },
          [ 'make_private', 'publish_latest_draft' ]
        );
      });

      describe('some public, some private', () => {
        itShowsOptions(
          {
            goalSelectionCount: {
              status_private: 2,
              status_public: 2,
              status_public_with_draft: 0
            }
          },
          [ 'make_private', 'publish_latest_draft' ]
        );
      });

      describe('all public goals, all with draft', () => {
        itShowsOptions(
          {
            goalSelectionCount: {
              status_private: 0,
              status_public: 0,
              status_public_with_draft: 2
            }
          },
          [ 'make_private', 'publish_latest_draft' ]
        );
      });

      describe('all public goals, some public with draft', () => {
        itShowsOptions(
          {
            goalSelectionCount: {
              status_private: 0,
              status_public: 2,
              status_public_with_draft: 1
            }
          },
          [ 'make_private', 'publish_latest_draft' ]
        );
      });

      describe('missing drafts, some public goals', () => {
        itShowsOptions(
          {
            publishDisabledBecauseMissingDrafts: true,
            goalSelectionCount: {
              status_private: 1,
              status_public: 1,
              status_public_with_draft: 1
            }
          },
          [ 'make_private' ]
        );
      });

      describe('missing drafts, all private goals', () => {
        it('hides dropdown', () => {
          output = render({
            publishDisabledBecauseMissingDrafts: true,
            goalSelectionCount: {
              status_private: 2,
              status_public: 0,
              status_public_with_draft: 0
            }
          });
          assert.lengthOf(
            output.find('.publishing-action-select'),
            0
          );
        });
      });
    });
  });
});
