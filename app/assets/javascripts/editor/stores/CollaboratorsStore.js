(function() {
  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  /**
   * @class CollaboratorsStore
   * @description
   * Maintains the state for the "Manage Collaborators" modal.
   * There are four actions that cause state change:
   *
   * Each of the following have bulk:
   * - COLABORATORS_LOAD
   * Each of the following are single operations:
   * - COLLABORATORS_ADD
   * - COLLABORATORS_MARK_REMOVAL
   * - COLLABORATORS_UNMARK_REMOVAL
   * - COLLABORATORS_REMOVE
   * - COLLABORATORS_CHANGE
   * - COLLABORATORS_SAVE
   * - COLLABORATORS_CANCEL
   */
  function CollaboratorsStore() {
    _.extend(this, new storyteller.Store());

    var self = this;
    var collaborators = [];
    var open = false;
    var saving = false;
    var errors = false;
    var message = null;
    var states = {
      ADDED: 'added',
      CHANGED: 'changed',
      LOADED: 'loaded',
      MARKED: 'marked',
      REMOVED: 'removed'
    };

    this.register(function(payload) {
      errors = false;
      message = false;

      switch (payload.action) {
        case Actions.COLLABORATORS_LOAD:
          loadCollaborators(payload);
          break;
        case Actions.COLLABORATORS_OPEN:
          openCollaboratorsModal();
          break;
        case Actions.COLLABORATORS_ADD:
          addCollaborator(payload);
          break;
        case Actions.COLLABORATORS_MARK_REMOVAL:
          markCollaborator(payload);
          break;
        case Actions.COLLABORATORS_UNMARK_REMOVAL:
          unmarkCollaborator(payload);
          break;
        case Actions.COLLABORATORS_REMOVE:
          removeCollaborator(payload);
          break;
        case Actions.COLLABORATORS_CHANGE:
          changeCollaborator(payload);
          break;
        case Actions.COLLABORATORS_SAVE:
          saveCollaborators();
          break;
        case Actions.COLLABORATORS_CANCEL:
          closeCollaboratorsModal();
          break;
        case Actions.COLLABORATORS_ERROR:
          captureErrors(payload);
          break;
      }
    });

    /**
     * Public Methods
     */

    /**
     * @function getCollaborators
     * @description
     * Read the current collaborators in this store.
     * @returns {Array} - A list of collaborators (Objects) that contain 'email' and 'accessLevel'
     */
    this.getCollaborators = function() {
      return _.cloneDeep(collaborators);
    };

    /**
     * @function getCollaborator
     * @description
     * Search by email address and return a single collaborator.
     * @param {String} email - A potential email address of a collaborator in the store.
     * @returns {Object|undefined} collaborator - A found collaborator.
     * @returns {String} collaborator.email - The found collaborator's email address.
     * @returns {String} collaborator.accessLevel - The found collaborator's access level.
     */
    this.getCollaborator = function(email) {
      return _.cloneDeep(_.find(collaborators, {email: email}));
    };

    /**
     * @function getErrorMessage
     * @description
     * The last user-visible error.
     * @returns {String} - A user-visible error String.
     */
    this.getErrorMessage = function() {
      return message;
    };

    /**
     * @function isOpen
     * @description
     * Determine whether or not the store has been asked to open the modal.
     * @returns {boolean}
     */
    this.isOpen = function() {
      return open;
    };

    /**
     * @function isDirty
     * @description
     * Determine whether or not the CollaboratorsStore has changed in a way that would
     * require persistence of the internal Array.
     */
    this.isDirty = function() {
      return _.any(collaborators, function(collaborator) {
        return collaborator.state && collaborator.state.current !== states.LOADED;
      });
    };

    /**
     * @function isSaving
     * @description
     * Determine whether or not the store has been asked to persist state.
     * @returns {boolean}
     */
    this.isSaving = function() {
      return saving;
    };

    /**
     * @function hasErrors
     * @description
     * A user-visible errors has occurred.
     * @return {boolean}
     */
    this.hasErrors = function() {
      return errors;
    };

    /**
     * Private Methods
     */

    /**
     * @function isValidCollaborator
     * @description
     * Considers a collaborator "valid" when it is an Object with two string properties, email and
     * accessLevel.
     * @param {Any} collaborator - a potential collaborator Object.
     * @returns {boolean}
     */
    function isValidCollaborator(collaborator) {
      return _.isPlainObject(collaborator) &&
        (_.isString(collaborator.email) || _.isString(collaborator.uid)) &&
        _.isString(collaborator.accessLevel);
    }

    this.isValidCollaborator = isValidCollaborator;

    /**
     * @function areValidCollaborators
     * @description
     * Considers a collaborator a true value from isValidCollaborator. This function operates
     * over an Array.
     * @param {Array} payloadCollaborators - an Array of potential collaborator Objects.
     * @returns {boolean}
     */
    function areValidCollaborators(payloadCollaborators) {
      return Array.isArray(payloadCollaborators) &&
        payloadCollaborators.every(isValidCollaborator);
    }

    /**
     * @function hasCollaborator
     * @description
     * Searches through the loaded collaborators Array for the payloadCollaborator. If found, a true boolean
     * value is returned. If not, a false boolean value is returned.
     * @param {Object} payloadCollaborator - a valid collaborator Object.
     * @returns {boolean}
     */
    function hasCollaborator(payloadCollaborator) {
      return _.some(collaborators, function(collaborator) {
        return collaborator.email === payloadCollaborator.email;
      });
    }

    this.hasCollaborator = hasCollaborator;

    /**
     * @function pushCollaboratorState
     * @description
     * Provides a function that returns a function that manipulates the collaborator's
     * state and returns a copy of the newly-updated collaborator.
     * @param {String} state - A string value from Collaborators.states
     * @returns {function} - A function that updates the collaborator with the state provided upon invocation.
     */
    function pushCollaboratorState(state) {
      return function(collaborator) {
        return {
          uid: collaborator.uid,
          email: collaborator.email,
          accessLevel: collaborator.accessLevel,
          displayName: collaborator.displayName,
          state: {
            previous: (collaborator.state && collaborator.state.current) || null,
            current: state
          }
        };
      };
    }

    /**
     * @function loadCollaborators
     * @description
     * Loads an Array of collaborators into the store. Each collaborator's state will be updated
     * to 'loaded'.
     *
     * This function contains asserts.
     * This function changes the store.
     * @param {Object} payload - An action payload dispatched through storyteller.dispatcher.
     */
    function loadCollaborators(payload) {
      utils.assertHasProperty(payload, 'collaborators');
      utils.assert(Array.isArray(payload.collaborators), 'Collaborators must be an Array.');
      utils.assert(areValidCollaborators(payload.collaborators), 'InvalidCollaboratorsError');

      collaborators = _.cloneDeep(payload.collaborators);
      collaborators = _.map(collaborators, pushCollaboratorState(states.LOADED));

      self._emitChange();
    }

    /**
     * @function addCollaborator
     * @description
     * Adds a single collaborator to the store. The collaborator's state will be updated to 'added'.
     *
     * This function contains asserts.
     * This function changes the store.
     * @param {Object} payload - An action payload dispatched through storyteller.dispatcher.
     */
    function addCollaborator(payload) {
      utils.assertHasProperty(payload, 'collaborator');
      utils.assert(isValidCollaborator(payload.collaborator), 'InvalidCollaboratorError');
      utils.assert(!hasCollaborator(payload.collaborator), 'CollaboratorExistsError');

      collaborators.push(
        pushCollaboratorState(states.ADDED)(
          _.cloneDeep(payload.collaborator)
        )
      );

      self._emitChange();
    }

    /**
     * @function markCollaborator
     * @description
     * Marks a single collaborator for removal.
     *
     * This function contains asserts.
     * This function changes the store.
     * @param {Object} payload - An action payload dispatched through storyteller.dispatcher.
     */
    function markCollaborator(payload) {
      utils.assertHasProperty(payload, 'collaborator');
      utils.assert(isValidCollaborator(payload.collaborator));
      utils.assert(hasCollaborator(payload.collaborator));

      collaborators = _.map(collaborators, function(collaborator) {
        if (collaborator.email === payload.collaborator.email) {
          return pushCollaboratorState(states.MARKED)(collaborator);
        } else {
          return collaborator;
        }
      });

      self._emitChange();
    }

    /**
     * @function unmarkCollaborator
     * @description
     * Unmarks a single collaborator by reverting back to the previous state.
     *
     * This function contains asserts.
     * This function changes the store.
     * @param {Object} payload - An action payload dispatched through storyteller.dispatcher.
     */
    function unmarkCollaborator(payload) {
      utils.assertHasProperty(payload, 'collaborator');
      utils.assert(isValidCollaborator(payload.collaborator));
      utils.assert(hasCollaborator(payload.collaborator));

      collaborators = _.map(collaborators, function(collaborator) {
        if (collaborator.email === payload.collaborator.email) {
          return pushCollaboratorState(collaborator.state.previous)(collaborator);
        } else {
          return collaborator;
        }
      });

      self._emitChange();
    }

    /**
     * @function removeCollaborator
     * @description
     * When dealing with a collaborator that is already persisted, the collaborator is marked
     * as 'removed'. When dealing with a collaborator that isn't persisted, it is removed
     * from the store's internal Array.
     *
     * This function contains asserts.
     * This function changes the store.
     * @param {Object} payload - An action payload dispatched through storyteller.dispatcher.
     */
    function removeCollaborator(payload) {
      utils.assertHasProperty(payload, 'collaborator');
      utils.assert(isValidCollaborator(payload.collaborator));
      utils.assert(hasCollaborator(payload.collaborator));

      collaborators = _.chain(collaborators).
        map(function(collaborator) {
          var matches = matchesCollaborator(collaborator, payload.collaborator);
          var isNewlyAdded = collaborator.state.current === states.ADDED;

          if (matches && !isNewlyAdded) {
            return pushCollaboratorState(states.REMOVED)(collaborator);
          } else if (matches && isNewlyAdded) {
            return undefined;
          } else {
            return collaborator;
          }
        }).
        compact().
        value();

      self._emitChange();
    }

    /**
     * @function matchesCollaborator
     * @description
     * Considered a match if emails are equals or display names
     */
    function matchesCollaborator(collaborator, potentialMatch) {
      return (
        collaborator.email === potentialMatch.email ||
        collaborator.uid === potentialMatch.uid
      );
    }

    /**
     * @function changeCollaborator
     * @description
     * When the collaborator is newly-added, we leave it's state as 'added'.
     * When the collaborator is persisted, we change it's state to 'changed'.
     *
     * This function contains asserts.
     * This function changes the store.
     * @param {Object} payload - An action payload dispatched through storyteller.dispatcher.
     */
    function changeCollaborator(payload) {
      utils.assertHasProperty(payload, 'collaborator');
      utils.assert(isValidCollaborator(payload.collaborator));
      utils.assert(hasCollaborator(payload.collaborator));

      collaborators = _.map(collaborators, function(collaborator) {
        var matches = matchesCollaborator(collaborator, payload.collaborator);
        var accessLevelChanged = collaborator.accessLevel !== payload.collaborator.accessLevel;
        var isNotNewlyAdded = collaborator.state.current !== states.ADDED;

        if (matches && accessLevelChanged) {
          collaborator.accessLevel = payload.collaborator.accessLevel;

          if (isNotNewlyAdded) {
            return pushCollaboratorState(states.CHANGED)(collaborator);
          } else {
            return collaborator;
          }
        } else {
          return collaborator;
        }
      });

      self._emitChange();
    }

    function captureErrors(payload) {
      saving = false;
      errors = true;
      message = payload.error;

      self._emitChange();
    }

    function openCollaboratorsModal() {
      open = true;
      self._emitChange();
    }

    function closeCollaboratorsModal() {
      open = saving = errors = false;
      message = null;
      collaborators = [];

      self._emitChange();
    }

    function saveCollaborators() {
      saving = true;
      self._emitChange();
    }
  }

  storyteller.CollaboratorsStore = CollaboratorsStore;
})();
