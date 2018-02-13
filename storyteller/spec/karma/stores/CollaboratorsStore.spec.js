import _ from 'lodash';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import CollaboratorsStore from 'editor/stores/CollaboratorsStore';

describe('CollaboratorsStore', function() {

  var dispatcher;
  var collaboratorsStore;

  function dispatchAction(action, payload) {
    payload = _.extend({action: action}, payload);
    dispatcher.dispatch(payload);
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
      });

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
    dispatcher = new Dispatcher();
    StoreAPI.__Rewire__('dispatcher', dispatcher);

    collaboratorsStore = new CollaboratorsStore();
  });

  afterEach(() => {
    StoreAPI.__ResetDependency__('dispatcher');
  });

  describe('COLLABORATORS_LOAD', function() {

    describeMalformedCollaborators('COLLABORATORS_LOAD');
    describe('when given a correct payload', function() {
      var collaborators;
      var collaboratorOne = {
        email: 'hello@socrata.com',
        accessLevel: 'accessLevel',
        displayName: 'Hello',
        roleName: 'administrator',
        uid: 'four-four'
      };
      var collaboratorTwo = {
        email: 'helloTwo@socrata.com',
        accessLevel: 'accessLevel',
        displayName: 'Hello Two',
        roleName: 'administrator',
        uid: 'four-four'
      };

      beforeEach(function() {
        dispatchAction(Actions.COLLABORATORS_LOAD, {
          collaborators: [collaboratorOne, collaboratorTwo]
        });

        collaborators = collaboratorsStore.getCollaborators();
      });

      it('should load all collaborators', function() {
        var collaboratorsWithoutState = _.map(
          collaborators,
          function(collaborator) {
            return _.omit(collaborator, 'state');
          }
        );

        assert.lengthOf(collaboratorsWithoutState, 2);

        assert.deepEqual(
          collaboratorsWithoutState[0],
          collaboratorOne
        );

        assert.deepEqual(
          collaboratorsWithoutState[1],
          collaboratorTwo
        );
      });

      it('should mark all collaborators "loaded"', function() {
        assert.lengthOf(collaborators, 2);
        assert.nestedPropertyVal(collaborators[0], 'state.current', 'loaded');
        assert.nestedPropertyVal(collaborators[1], 'state.current', 'loaded');
      });
    });
  });

  describe('COLLABORATORS_ADD', function() {

    describeMalformedCollaborator('COLLABORATORS_ADD');
    describe('when given a correct payload', function() {
      it('should add one collaborator to the store', function() {
        var collaborators;
        var collaboratorStub = {
          email: 'hello@socrata.com',
          accessLevel: 'accessLevel',
          uid: 'four-four',
          displayName: 'Hello',
          roleName: 'administrator'
        };

        dispatchAction(Actions.COLLABORATORS_LOAD, {
          collaborators: [collaboratorStub]
        });

        collaborators = _.map(
          collaboratorsStore.getCollaborators(),
          function(collaborator) {
            return _.omit(collaborator, 'state');
          }
        );

        assert.sameDeepMembers(
          collaborators,
          [collaboratorStub]
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

        collaborators = collaboratorsStore.getCollaborators();

        assert.lengthOf(collaborators, 1);
        assert.nestedPropertyVal(
          collaborators[0],
          'state.current',
          'removed'
        );
      });

      it('should remove a newly added collaborator from the store', function() {
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
          collaboratorsStore.getCollaborators(),
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
        var collaboratorOne = {
          email: 'hello@socrata.com',
          accessLevel: 'accessLevel',
          uid: 'four-four',
          displayName: 'Hello',
          roleName: 'administrator'
        };
        var collaboratorTwo = {
          email: 'helloTwo@socrata.com',
          accessLevel: 'accessLevel',
          uid: 'some-othr',
          displayName: 'Hello Two',
          roleName: 'administrator'
        };
        var updatedCollaboratorOne = {
          email: 'hello@socrata.com',
          accessLevel: 'newAccessLevel',
          uid: 'four-four',
          displayName: 'Hello',
          roleName: 'administrator'
        };

        dispatchAction(Actions.COLLABORATORS_LOAD, {
          collaborators: [collaboratorOne, collaboratorTwo]
        });

        dispatchAction(Actions.COLLABORATORS_CHANGE, {
          collaborator: updatedCollaboratorOne
        });

        collaborators = _.map(collaboratorsStore.getCollaborators(), function(collaborator) {
          return _.omit(collaborator, 'state');
        });

        assert.lengthOf(collaborators, 2);
        assert.deepEqual(collaborators[0], updatedCollaboratorOne);
        assert.deepEqual(collaborators[1], collaboratorTwo);
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

        assert.nestedPropertyVal(
          collaboratorsStore.getCollaborators()[0],
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


        collaborator = collaboratorsStore.getCollaborators()[0];

        assert.nestedPropertyVal(
          collaborator,
          'state.current',
          'loaded'
        );

        assert.nestedPropertyVal(
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
      assert.isTrue(collaboratorsStore.isOpen());
    });
  });

  describe('COLLABORATORS_CANCEL', function() {
    it('should set the open state to false', function() {
      dispatchAction(Actions.COLLABORATORS_CANCEL);
      assert.isFalse(collaboratorsStore.isOpen());
    });
  });

  describe('COLLABORATORS_SAVE', function() {
    it('should set the saving state to true', function() {
      dispatchAction(Actions.COLLABORATORS_SAVE);
      assert.isTrue(collaboratorsStore.isSaving());
    });
  });
});
