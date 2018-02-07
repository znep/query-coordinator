import $ from 'jquery';
import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import {__RewireAPI__ as StoryStoreAPI} from 'editor/stores/StoryStore';
import CollaboratorsStore, {__RewireAPI__ as CollaboratorsStoreAPI} from 'editor/stores/CollaboratorsStore';
import CollaboratorsRenderer, {__RewireAPI__ as CollaboratorsRendererAPI} from 'editor/renderers/CollaboratorsRenderer';

describe('CollaboratorsRenderer', () => {

  let dispatcher;
  let $collaborators;
  let renderer;
  let server;
  let debounceStub;

  let userLookupResponse;
  function respondWithNoUserFound() {
    userLookupResponse = { userExists: false, hasStoriesRights: false };
  }

  function respondWithFoundUser(hasStoriesRights) {
    userLookupResponse = { userExists: true, hasStoriesRights };
  }

  function MockCollaboratorsDataProvider() {
    this.doesUserWithEmailHaveStoriesRights = () => Promise.resolve(userLookupResponse);
    this.getCollaborators = () => Promise.resolve([]);
  }

  beforeEach(() => {
    debounceStub = sinon.stub(window._, 'debounce').callsFake((fn) => fn);

    server = sinon.fakeServer.create();
    server.respondImmediately = true;
    dispatcher = new Dispatcher();

    let environment = {
      STORY_UID: 'what-what',
      CURRENT_USER: {id: 'test-test'}
    };

    StoreAPI.__Rewire__('dispatcher', dispatcher);
    CollaboratorsRendererAPI.__Rewire__('dispatcher', dispatcher);
    CollaboratorsStoreAPI.__Rewire__('dispatcher', dispatcher);
    StoryStoreAPI.__Rewire__('dispatcher', dispatcher);

    CollaboratorsRendererAPI.__Rewire__('storyStore', {
      getStoryPrimaryOwnerUid: _.constant('test-test')
    });
    CollaboratorsRendererAPI.__Rewire__('collaboratorsStore', new CollaboratorsStore());
    CollaboratorsRendererAPI.__Rewire__('Environment', environment);
    CollaboratorsRendererAPI.__Rewire__('CollaboratorsDataProvider', MockCollaboratorsDataProvider);

    renderer = new CollaboratorsRenderer();

    dispatcher.dispatch({
      action: Actions.COLLABORATORS_OPEN
    });

    $collaborators = $('#collaborators-modal');
  });

  afterEach(() => {
    delete window.PRIMARY_OWNER_UID;

    StoreAPI.__ResetDependency__('dispatcher');
    CollaboratorsRendererAPI.__ResetDependency__('dispatcher');
    CollaboratorsStoreAPI.__ResetDependency__('dispatcher');
    StoryStoreAPI.__ResetDependency__('dispatcher');

    CollaboratorsRendererAPI.__ResetDependency__('collaboratorsStore');
    CollaboratorsRendererAPI.__ResetDependency__('Environment');
    CollaboratorsRendererAPI.__ResetDependency__('CollaboratorsDataProvider');

    renderer.destroy();
    debounceStub.restore();
    server.restore();
  });

  describe('rendering', () => {
    it('should have a quick-add input area', () => {
      assert.lengthOf($collaborators.find('.modal-input-group'), 1);
    });

    it('should have a button group', () => {
      assert.lengthOf($collaborators.find('.modal-button-group'), 1);
    });

    describe('with no collaborators', () => {
      it('should have a collaborators table', () => {
        assert.lengthOf($collaborators.find('table'), 1);
      });

      it('should have an empty notice entry in the table', () => {
        assert.lengthOf($collaborators.find('td.collaborators-empty'), 1);
      });
    });

    describe('with collaborators', () => {
      let $tr;

      beforeEach(() => {
        dispatcher.dispatch({
          action: Actions.COLLABORATORS_LOAD,
          collaborators: [{email: 'already-shared-with@socrata.com', accessLevel: 'accessLevel', uid: 'four-four', displayName: 'Hello'}]
        });

        dispatcher.dispatch({
          action: Actions.COLLABORATORS_OPEN
        });

        $tr = $collaborators.find('tbody tr');
      });

      it('should have a collaborators table', () => {
        assert.lengthOf($collaborators.find('table'), 1);
      });

      it('should have one, valid entry in the table', () => {
        $tr = $collaborators.find('tbody tr');

        assert.lengthOf($tr, 1);
        assert.lengthOf($tr.find('select'), 1);
        assert.lengthOf($tr.find('button'), 1);
        assert.isTrue($tr.hasClass('loaded'));
      });

      it('should have data-* attributes that identify the table entry', () => {
        assert.equal($tr.attr('data-email'), 'already-shared-with@socrata.com');
        assert.equal($tr.attr('data-access-level'), 'accessLevel');
      });

      it('should have a class that identifies the table\'s state', () => {
        assert.isTrue($tr.hasClass('loaded'));
      });
    });
  });

  describe('events', () => {
    beforeEach(() => {
      dispatcher.dispatch({
        action: Actions.COLLABORATORS_LOAD,
        collaborators: [{
          email: 'already-shared-with@socrata.com',
          accessLevel: 'viewer'
        }]
      });

      dispatcher.dispatch({
        action: Actions.COLLABORATORS_OPEN
      });
    });

    describe('closing the modal', () => {
      describe('when clicking the "Cancel" button', () => {
        it('should add a "hidden" class', () => {
          $collaborators.
            find('.btn-default[data-action="COLLABORATORS_CANCEL"]').
            click();

          assert.isTrue($collaborators.hasClass('hidden'));
        });
      });

      describe('when the modal indicates it is dismissed', () => {
        it('should add a "hidden" class to the modal', () => {
          $collaborators.trigger('modal-dismissed');

          assert.isTrue($collaborators.hasClass('hidden'));
        });

        it('should add a "hidden" class to any warnings present', () => {
          let $alreadyAddedWarning = $collaborators.find('.already-added');

          $alreadyAddedWarning.removeClass('hidden');
          $collaborators.trigger('modal-dismissed');

          assert.isTrue($alreadyAddedWarning.hasClass('hidden'));
        });
      });
    });

    describe('adding a collaborator', () => {
      let $email;

      beforeEach(() => {
        $email = $collaborators.find('input[type="email"]');
      });

      it('should disallow an improperly-structured email', () => {
        $email.
          val('hello').
          trigger('input');

        assert.isTrue(
          $collaborators.find('[data-action="COLLABORATORS_ADD"]').prop('disabled')
        );
      });

      it('should disallow adding the user\'s email address', () => {
        $email.
          val('rawr@socrata.com').
          trigger('input');

        assert.isTrue(
          $collaborators.find('[data-action="COLLABORATORS_ADD"]').prop('disabled')
        );
      });

      it('should disallow adding an already-added user\'s email address', () => {
        $email.
          val('already-shared-with@socrata.com').
          trigger('input');

        assert.isTrue(
          $collaborators.find('[data-action="COLLABORATORS_ADD"]').prop('disabled')
        );
      });

      it('should disallow a properly-structured but unregistered email address', (done) => {
        $email.
          val('valid-but-not-a-user@valid.com').
          trigger('input');

        respondWithNoUserFound();

        setTimeout(
          () => {
            assert.isTrue(
              $collaborators.find('[data-action="COLLABORATORS_ADD"]').prop('disabled')
            );

            done();
          },
          300
        );
      });

      describe('user has stories rights', () => {
        verifyAddButtonBehavior(true);

        it('should enable owner selection for a user with stories rights', (done) => {
          respondWithFoundUser(true);

          $email.val('valid@valid.com').trigger('input');

          setTimeout(
            () => {

              assert.isFalse(
                $collaborators.find('.modal-radio-group ul li:last-child label').hasClass('disabled')
              );

              done();
            },
            300
          );
        });
      });

      describe('user does not have stories rights', () => {
        verifyAddButtonBehavior(false);

        it('should disable owner selection for users without stories rights', (done) => {
          respondWithFoundUser(false);

          $email.val('valid@valid.com').trigger('input');

          setTimeout(
            () => {
              assert.isTrue(
                $collaborators.find('.modal-radio-group ul li:last-child label').hasClass('disabled')
              );

              done();
            },
            300
          );
        });
      });

      function verifyAddButtonBehavior(hasStoriesRights) {
        describe('add button', () => {
          let $resultantTableRow;

          function addCollaborator() {
            $collaborators.find('.modal-input-group button').click();
          }

          beforeEach((done) => {
            respondWithFoundUser(hasStoriesRights);

            $email.val('valid@valid.com').trigger('input');

            setTimeout(
              () => {
                addCollaborator();
                $resultantTableRow = $collaborators.find('tbody tr[data-email="valid@valid.com"]');
                done();
              },
              300
            );
          });

          it('should add the collaborator to the table', () => {
            assert.lengthOf(
              $resultantTableRow,
              1
            );
          });

          it('should set the row state class to "added"', () => {
            assert.isTrue($resultantTableRow.hasClass('added'));
          });
        });
      }
    });

    describe('when manipulating a newly-added collaborator', () => {
      let newCollaborator = 'new@socrata.com';
      let newestCollaborator = 'newest@socrata.com';

      function getCollaborator(email) {
        return $collaborators.find('tbody tr[data-email="' + email + '"]');
      }

      beforeEach(() => {
        dispatcher.dispatch({
          action: Actions.COLLABORATORS_ADD,
          collaborator: {email: newCollaborator, accessLevel: 'viewer'}
        });

        dispatcher.dispatch({
          action: Actions.COLLABORATORS_ADD,
          collaborator: {email: newestCollaborator, accessLevel: 'viewer'}
        });
      });

      describe('removing a newly-added collaborator', () => {
        it('should immediately remove the collaborator from the table', () => {
          let $tr = getCollaborator(newCollaborator);
          assert.lengthOf($tr, 1);

          $tr.find('button').click();

          $tr = getCollaborator(newCollaborator);
          assert.lengthOf($tr, 0);
        });
      });

      describe('changing a newly-added collaborator', () => {
        it('should not change the collaborator\'s "added" state.', () => {
          let $tr = getCollaborator(newCollaborator);
          let $selected = $tr.find('option:selected');

          assert.equal($selected.val(), 'viewer');

          $selected.
            prop('selected', false);
          $selected = $tr.
            find('option[value="contributor"]').
            prop('selected', true);
          $tr.
            find('select').
            trigger('change');

          $tr = getCollaborator(newCollaborator);
          $selected = $tr.find('option:selected');

          assert.equal($selected.val(), 'contributor');
          assert.isTrue($tr.hasClass('added'));
        });

        it('should only change the targeted, new collaborator', () => {
          let $trNewest;
          let $tr = getCollaborator(newCollaborator);
          let $selected = $tr.find('option:selected');

          $selected.
            prop('selected', false);
          $selected = $tr.
            find('option[value="contributor"]').
            prop('selected', true);
          $tr.
            find('select').
            trigger('change');

          $tr = getCollaborator(newCollaborator);
          $trNewest = getCollaborator(newestCollaborator);

          assert.notEqual(
            $tr.find('option:selected').val(),
            $trNewest.find('option:selected').val()
          );
        });
      });
    });

    describe('when manipulating a persisted collaborator', () => {
      describe('removing a presisted collaborator', () => {
        it('should change the collaborator\'s state to "marked"', () => {
          let $tr = $collaborators.find('tbody tr');
          let $button = $tr.find('button');

          $button.click();
          $tr = $collaborators.find('tbody tr');

          assert.isTrue($tr.hasClass('marked'));
        });
      });

      describe('keeping a persisted collaborator aftering attempting to remove', () => {
        it('should change the collaborator\'s state back to the previous state', () => {
          let $tr = $collaborators.find('tbody tr');
          let $button = $tr.find('button');

          $button.click();
          $tr = $collaborators.find('tbody tr');
          $button = $tr.find('button');

          assert.isTrue($tr.hasClass('marked'));

          $button.click();
          $tr = $collaborators.find('tbody tr');

          assert.isTrue($tr.hasClass('loaded'));
        });
      });

      describe('changing a persisted collaborator', () => {
        it('should change the collaborator\'s state to "changed"', () => {
          let $tr = $collaborators.find('tbody tr');
          let $selected = $tr.find('option:selected');
          assert.equal($selected.val(), 'viewer');

          $selected.
            prop('selected', false);
          $selected = $tr.
            find('option[value="contributor"]').
            prop('selected', true);
          $tr.
            find('select').
            trigger('change');
          $tr = $collaborators.find('tbody tr');

          assert.equal($selected.val(), 'contributor');
          assert.isTrue($tr.hasClass('changed'));
        });
      });
    });
  });
});
