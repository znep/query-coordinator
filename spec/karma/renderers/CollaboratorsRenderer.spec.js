describe('CollaboratorsRenderer', function() {
  'use strict';

  var $collaborators;
  var renderer;
  var server;
  var storyteller = window.socrata.storyteller;
  var debounceStub;

  beforeEach(function() {
    window.mockedXMLHttpRequest.restore();
    window.primaryOwnerUid = 'test-test';
    debounceStub = sinon.stub(window._, 'debounce', function(fn) {
      return fn;
    });

    server = sinon.fakeServer.create();
    renderer = new storyteller.CollaboratorsRenderer();

    storyteller.dispatcher.dispatch({
      action: Actions.COLLABORATORS_OPEN
    });

    $collaborators = $('#collaborators-modal');
  });

  afterEach(function() {
    delete window.primaryOwnerUid;
    renderer.destroy();
    debounceStub.restore();
    server.restore();
    window.mockedXMLHttpRequest = sinon.useFakeXMLHttpRequest();
  });

  describe('rendering', function() {
    it('should have a quick-add input area', function() {
      assert.lengthOf($collaborators.find('.modal-input-group'), 1);
    });

    it('should have a button group', function() {
      assert.lengthOf($collaborators.find('.modal-button-group'), 1);
    });

    describe('with no collaborators', function() {
      it('should have a collaborators table', function() {
        assert.lengthOf($collaborators.find('table'), 1);
      });

      it('should have an empty notice entry in the table', function() {
        assert.lengthOf($collaborators.find('td.collaborators-empty'), 1);
      });
    });

    describe('with collaborators', function() {
      var $tr;

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.COLLABORATORS_LOAD,
          collaborators: [{email: 'hello@socrata.com', accessLevel: 'accessLevel', uid: 'four-four', displayName: 'Hello'}]
        });

        storyteller.dispatcher.dispatch({
          action: Actions.COLLABORATORS_OPEN
        });

        $tr = $collaborators.find('tbody tr');
      });

      it('should have a collaborators table', function() {
        assert.lengthOf($collaborators.find('table'), 1);
      });

      it('should have one, valid entry in the table', function() {
        $tr = $collaborators.find('tbody tr');

        assert.lengthOf($tr, 1);
        assert.lengthOf($tr.find('select'), 1);
        assert.lengthOf($tr.find('button'), 1);
        assert.isTrue($tr.hasClass('loaded'));
      });

      it('should have data-* attributes that identify the table entry', function() {
        assert.equal($tr.attr('data-email'), 'hello@socrata.com');
        assert.equal($tr.attr('data-access-level'), 'accessLevel');
      });

      it('should have a class that identifies the table\'s state', function() {
        assert.isTrue($tr.hasClass('loaded'));
      });
    });
  });

  describe('events', function() {
    beforeEach(function() {
      storyteller.dispatcher.dispatch({
        action: Actions.COLLABORATORS_LOAD,
        collaborators: [{
          email: 'hello@socrata.com',
          accessLevel: 'viewer'
        }]
      });

      storyteller.dispatcher.dispatch({
        action: Actions.COLLABORATORS_OPEN
      });
    });

    describe('closing the modal', function() {
      describe('when clicking the "Cancel" button', function() {
        it('should add a "hidden" class', function() {
          $collaborators.
            find('.btn-default[data-action="COLLABORATORS_CANCEL"]').
            click();

          assert.isTrue($collaborators.hasClass('hidden'));
        });
      });

      describe('when the modal indicates it is dismissed', function() {
        it('should add a "hidden" class to the modal', function() {
          $collaborators.trigger('modal-dismissed');

          assert.isTrue($collaborators.hasClass('hidden'));
        });

        it.only('should add a "hidden" class to any warnings present', function() {
          var $alreadyAddedWarning = $collaborators.find('.already-added');

          $alreadyAddedWarning.removeClass('hidden');
          $collaborators.trigger('modal-dismissed');

          assert.isTrue($alreadyAddedWarning.hasClass('hidden'));
        });
      });
    });

    describe('adding a collaborator', function() {
      var $email;

      beforeEach(function() {
        $email = $collaborators.find('input[type="email"]');
      });

      it('should disallow an improperly-structured email', function() {
        $email.
          val('hello').
          trigger('input');

        assert.isTrue(
          $collaborators.find('[data-action="COLLABORATORS_ADD"]').prop('disabled')
        );
      });

      it('should disallow adding the user\'s email address', function() {
        $email.
          val('rawr@socrata.com').
          trigger('input');

        assert.isTrue(
          $collaborators.find('[data-action="COLLABORATORS_ADD"]').prop('disabled')
        );
      });

      it('should disallow adding an already-added user\'s email address', function() {
        $email.
          val('hello@socrata.com').
          trigger('input');

        assert.isTrue(
          $collaborators.find('[data-action="COLLABORATORS_ADD"]').prop('disabled')
        );
      });

      it('should allow a properly-structured email address', function(done) {
        $email.
          val('valid@valid.com').
          trigger('input');

        server.respond([200, {'Content-Type': 'application/json'}, '']);

        _.defer(function() {
          assert.isFalse(
            $collaborators.find('[data-action="COLLABORATORS_ADD"]').prop('disabled')
          );

          done();
        });
      });

      describe('with a valid collaborator', function() {
        var response = [200, {'Content-Type': 'application/json'}, '{}'];
        var addCollaborator = function() {
          $collaborators.find('.modal-input-group button').click();
          return $collaborators.find('tbody tr[data-email="valid@valid.com"]');
        };

        beforeEach(function() {
          $email.
            val('valid@valid.com').
            trigger('input');

          server.respond(response);
        });

        it('should add the collaborator to the table', function(done) {
          _.defer(function() {
            var $tr = addCollaborator();
            assert.lengthOf($tr, 1);
            done();
          });
        });

        it('should set the row state class to "added"', function(done) {
          _.defer(function() {
            var $tr = addCollaborator();
            assert.isTrue($tr.hasClass('added'));
            done();
          });
        });
      });
    });

    describe('when manipulating a newly-added collaborator', function() {
      var newCollaborator = 'new@socrata.com';
      var newestCollaborator = 'newest@socrata.com';

      function getCollaborator(email) {
        return $collaborators.find('tbody tr[data-email="' + email + '"]');
      }

      beforeEach(function() {
        storyteller.dispatcher.dispatch({
          action: Actions.COLLABORATORS_ADD,
          collaborator: {email: newCollaborator, accessLevel: 'viewer'}
        });

        storyteller.dispatcher.dispatch({
          action: Actions.COLLABORATORS_ADD,
          collaborator: {email: newestCollaborator, accessLevel: 'viewer'}
        });
      });

      describe('removing a newly-added collaborator', function() {
        it('should immediately remove the collaborator from the table', function() {
          var $tr = getCollaborator(newCollaborator);
          assert.lengthOf($tr, 1);

          $tr.find('button').click();

          $tr = getCollaborator(newCollaborator);
          assert.lengthOf($tr, 0);
        });
      });

      describe('changing a newly-added collaborator', function() {
        it('should not change the collaborator\'s "added" state.', function() {
          var $tr = getCollaborator(newCollaborator);
          var $selected = $tr.find('option:selected');

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

        it('should only change the targeted, new collaborator', function() {
          var $trNewest;
          var $tr = getCollaborator(newCollaborator);
          var $selected = $tr.find('option:selected');

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

    describe('when manipulating a persisted collaborator', function() {
      describe('removing a presisted collaborator', function() {
        it('should change the collaborator\'s state to "marked"', function() {
          var $tr = $collaborators.find('tbody tr');
          var $button = $tr.find('button');

          $button.click();
          $tr = $collaborators.find('tbody tr');

          assert.isTrue($tr.hasClass('marked'));
        });
      });

      describe('keeping a persisted collaborator aftering attempting to remove', function() {
        it('should change the collaborator\'s state back to the previous state', function() {
          var $tr = $collaborators.find('tbody tr');
          var $button = $tr.find('button');

          $button.click();
          $tr = $collaborators.find('tbody tr');
          $button = $tr.find('button');

          assert.isTrue($tr.hasClass('marked'));

          $button.click();
          $tr = $collaborators.find('tbody tr');

          assert.isTrue($tr.hasClass('loaded'));
        });
      });

      describe('changing a persisted collaborator', function() {
        it('should change the collaborator\'s state to "changed"', function() {
          var $tr = $collaborators.find('tbody tr');
          var $selected = $tr.find('option:selected');
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
