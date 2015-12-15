describe('CollaboratorsStore', function() {
  'use strict';

  function dispatchAction(action, payload) {
    var payload = _.extend({action: action}, payload);
    storyteller.dispatcher.dispatch(payload);
  }

  function describeMalformedCollaborator(action) {
    describe('when given an incorrect payload', function() {
      it('throws when top-level attributes are missing', function() {

        // Missing collaborator or collaborators
        assert.throws(function() {
          dispatchAction(action, {});
        });
      });

      it('throws when collaborator is malformed', function() {

        // Not an object
        assert.throws(function() {
          dispatchAction(action, {
            collaborator: []
          });
        });

        // Missing accessLevel
        assert.throws(function() {
          dispatchAction(action, {
            collaborator: {
              email: 'hello@socrata.com'
            }
          });
        });

        // Missing email
        assert.throws(function() {
          dispatchAction(action, {
            collaborator: {
              accessLevel: 'accessLevel'
            }
          });
        });
      })

      if (action === Actions.COLLABORATORS_ADD) {
        it('throws when the collaborator exists', function() {
          var collaboratorOne = {
            email: 'hello@socrata.com',
            accessLevel: 'accessLevel'
          };

          dispatchAction(Actions.COLLABORATORS_LOAD, {
            collaborators: [collaboratorOne]
          });

          assert.throws(function() {
            dispatchAction(action, {
              collaborator: collaboratorOne
            });
          });
        });
      } else {
        it('throws when the collaborator does not exist', function() {
          assert.throws(function() {
            dispatchAction(action, {
              collaborator: {
                email: 'hello@socrata.com',
                accessLevel: 'accessLevel'
              }
            });
          });
        });
      }
    });
  }

  function describeMalformedCollaborators(action) {
    it('throws when collaborators is malformed', function() {

      // Not an Array
      assert.throws(function() {
        dispatchAction(action, {
          collaborators: {}
        });
      });

      // Missing email
      assert.throws(function() {
        dispatchAction(action, {
          collaborators: [
            {accessLevel: 'accessLevel'}
          ]
        });
      });

      // Missing accessLevel
      assert.throws(function() {
        dispatchAction(action, {
          collaborators: [
            {email: 'hello@socrata.com'}
          ]
        });
      });
    });
  }

  beforeEach(function() {
    storyteller.collaboratorsStore = new storyteller.CollaboratorsStore();
  });

  describe('COLLABORATORS_LOAD', function() {

    describeMalformedCollaborators('COLLABORATORS_LOAD');
    describe('when given a correct payload', function() {
      var collaborators;
      var collaboratorOne = {
        email: 'hello@socrata.com',
        accessLevel: 'accessLevel',
        displayName: 'Hello',
        uid: 'four-four'
      };
      var collaboratorTwo = {
        email: 'helloTwo@socrata.com',
        accessLevel: 'accessLevel',
        displayName: 'Hello Two',
        uid: 'four-four'
      };

      beforeEach(function() {
        dispatchAction(Actions.COLLABORATORS_LOAD, {
          collaborators: [collaboratorOne, collaboratorTwo]
        });

        collaborators = storyteller.collaboratorsStore.getCollaborators();
      });

      it('should load all collaborators', function() {
        var collaboratorsWithoutState = _.map(
          collaborators,
          function(collaborator) {
            return _.omit(collaborator, 'state');
          }
        );

        assert.lengthOf(collaboratorsWithoutState, 2);

        assert.include(
          collaboratorsWithoutState,
          collaboratorOne
        );

        assert.include(
          collaboratorsWithoutState,
          collaboratorTwo
        );
      });

      it('should mark all collaborators "loaded"', function() {
        assert.lengthOf(collaborators, 2);
        assert.deepPropertyVal(collaborators[0], 'state.current', 'loaded');
        assert.deepPropertyVal(collaborators[1], 'state.current', 'loaded');
      });
    });
  });

  describe('COLLABORATORS_ADD', function() {

    describeMalformedCollaborator('COLLABORATORS_ADD');
    describe('when given a correct payload', function() {
      it('should add one collaborator to the store', function() {
        var collaborators;
        var collaborator = {
          email: 'hello@socrata.com',
          accessLevel: 'accessLevel',
          uid: 'four-four',
          displayName: 'Hello'
        };

        dispatchAction(Actions.COLLABORATORS_LOAD, {
          collaborators: [collaborator]
        });

        collaborators = _.map(
          storyteller.collaboratorsStore.getCollaborators(),
          function(collaborator) {
            return _.omit(collaborator, 'state');
          }
        );

        assert.sameDeepMembers(
          collaborators,
          [collaborator]
        );
      });
    });
  });

  describe('COLLABORATORS_REMOVE', function() {

    describeMalformedCollaborator('COLLABORATORS_REMOVE');
    describe('when given a correct payload', function() {
      it('should mark one existing collaborator "removed" from the store', function() {
        var collaborators;
        var collaboratorOne = {
          email: 'hello@socrata.com',
          accessLevel: 'accessLevel'
        };

        dispatchAction(Actions.COLLABORATORS_LOAD, {
          collaborators: [collaboratorOne]
        });

        dispatchAction(Actions.COLLABORATORS_REMOVE, {
          collaborator: collaboratorOne
        });

        collaborators = storyteller.collaboratorsStore.getCollaborators();

        assert.lengthOf(collaborators, 1);
        assert.deepPropertyVal(
          collaborators[0],
          'state.current',
          'removed'
        );
      });

      it('should remove a newly added collaborator from the store', function() {
        var collaborators;
        var collaboratorOne = {
          email: 'hello@socrata.com',
          accessLevel: 'accessLevel'
        };

        dispatchAction(Actions.COLLABORATORS_ADD, {
          collaborator: collaboratorOne
        });

        dispatchAction(Actions.COLLABORATORS_REMOVE, {
          collaborator: collaboratorOne
        });

        assert.lengthOf(
          storyteller.collaboratorsStore.getCollaborators(),
          0
        );
      });
    });
  });

  describe('COLLABORATORS_CHANGE', function() {

    describeMalformedCollaborator('COLLABORATORS_CHANGE');
    describe('when given a correct payload', function() {
      it('should change one collaborator in the store', function() {
        var collaborators;
        var collaboratorOne = {email: 'hello@socrata.com', accessLevel: 'accessLevel', uid: 'four-four', displayName: 'Hello'};
        var collaboratorTwo = {email: 'helloTwo@socrata.com', accessLevel: 'accessLevel', uid: 'four-four', displayName: 'Hello Two'};
        var updatedCollaboratorOne = {email: 'hello@socrata.com', accessLevel: 'newAccessLevel', uid: 'four-four', displayName: 'Hello'};

        dispatchAction(Actions.COLLABORATORS_LOAD, {
          collaborators: [collaboratorOne, collaboratorTwo]
        });

        dispatchAction(Actions.COLLABORATORS_CHANGE, {
          collaborator: updatedCollaboratorOne
        });

        collaborators = _.map(storyteller.collaboratorsStore.getCollaborators(), function(collaborator) {
          return _.omit(collaborator, 'state');
        });

        assert.lengthOf(collaborators, 2);
        assert.include(collaborators, updatedCollaboratorOne);
      });
    });
  });

  describe('COLLABORATORS_MARK_REMOVAL', function() {

    describeMalformedCollaborator('COLLABORATORS_MARK_REMOVAL');
    describe('when given a correct payload', function() {
      it('should mark one existing collaborator "marked" for removal', function() {
        var collaboratorOne = {
          email: 'hello@socrata.com',
          accessLevel: 'accessLevel'
        };

        dispatchAction(Actions.COLLABORATORS_LOAD, {
          collaborators: [collaboratorOne]
        });

        dispatchAction(Actions.COLLABORATORS_MARK_REMOVAL, {
          collaborator: collaboratorOne
        });

        assert.deepPropertyVal(
          storyteller.collaboratorsStore.getCollaborators()[0],
          'state.current',
          'marked'
        );
      });
    });
  });

  describe('COLLABORATORS_UNMARK_REMOVAL', function() {

    describeMalformedCollaborator('COLLABORATORS_UNMARK_REMOVAL');
    describe('when given a correct payload', function() {
      it('should revert an existing collaborator back to it\'s previous state', function() {
        var collaborator;
        var collaboratorOne = {
          email: 'hello@socrata.com',
          accessLevel: 'accessLevel'
        };

        dispatchAction(Actions.COLLABORATORS_LOAD, {
          collaborators: [collaboratorOne]
        });

        dispatchAction(Actions.COLLABORATORS_MARK_REMOVAL, {
          collaborator: collaboratorOne
        });

        dispatchAction(Actions.COLLABORATORS_UNMARK_REMOVAL, {
          collaborator: collaboratorOne
        });


        collaborator = storyteller.collaboratorsStore.getCollaborators()[0];

        assert.deepPropertyVal(
          collaborator,
          'state.current',
          'loaded'
        );

        assert.deepPropertyVal(
         collaborator,
         'state.previous',
         'marked'
        );
      });
    });
  });

  describe('COLLABORATORS_OPEN', function() {
    it('should set the open state to true', function() {
      dispatchAction(Actions.COLLABORATORS_OPEN);
      assert.isTrue(storyteller.collaboratorsStore.isOpen());
    });
  });

  describe('COLLABORATORS_CANCEL', function() {
    it('should set the open state to false', function() {
      dispatchAction(Actions.COLLABORATORS_CANCEL);
      assert.isFalse(storyteller.collaboratorsStore.isOpen());
    });
  });

  describe('COLLABORATORS_SAVE', function() {
    it('should set the saving state to true', function() {
      dispatchAction(Actions.COLLABORATORS_SAVE);
      assert.isTrue(storyteller.collaboratorsStore.isSaving());
    });
  });
});
