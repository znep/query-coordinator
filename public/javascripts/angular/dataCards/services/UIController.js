//TODO rename
(function() {

  'use strict';

  angular.module('dataCards.services').factory('UIController', function() {

    var UIController = function(layoutFn, dataModelObservable) {

      var controller = this;

      /******************
      * Valid UI states *
      ******************/

      function UIRestState() {

        return {

          getState: function() {

            return 'UIRestState';
 
          },

          enter: function() {

          },

          mouseDown: function(event) {
            controller.transitionTo('UPDATE');
          },

          scroll: function(event) {
            controller.transitionTo('LAYOUT');
          },

          resize: function(event) {
            controller.transitionTo('LAYOUT');
          },

          dataChange: function() {
            controller.transitionTo('LAYOUT');
          }

        };

      };

      function UILayoutState() {

        return {

          getState: function() {

            return 'UILayoutState';

          },

          enter: function() {

            // Pass along the vertical scroll offset to the layout function so it can decide
            // whether or not to draw the quick filter bar in sticky mode.
            //TODO Magical param...
            // Why isn't it part of the data model?
            controller.layoutFn.apply(controller, controller.dataModel.concat(controller.scrollY));

            if (!controller.pointerLeft) {
              controller.transitionTo('REST');
            }

          },

          mouseDown: function(event) {
            controller.transitionTo('UPDATE');
          },

          mouseUp: function(event) {
            controller.transitionTo('UPDATE');
          },

          mouseMove: function(event) {
            if (controller.pointerLeft) {
              controller.transitionTo('UPDATE');
            } else {
              controller.transitionTo('REST');
            }
          },

          scroll: function(event) {
            controller.transitionTo('LAYOUT');
          },

          resize: function(event) {
            controller.transitionTo('LAYOUT');
          },

          dataChange: function() {
            controller.transitionTo('LAYOUT');
          }

        };

      };

      function UIUpdateState() {

        return {

          getState: function() {
            return 'UIUpdateState';
          },

          enter: function() {

          },

          mouseUp: function(event) {
            controller.transitionTo('LAYOUT');
          },

          mouseMove: function(event) {
            controller.transitionTo('LAYOUT');
          },

          scroll: function(event) {
            controller.transitionTo('LAYOUT');
          },

          resize: function(event) {
            controller.transitionTo('LAYOUT');
          },

          dataChange: function() {
            controller.transitionTo('LAYOUT');
          }

        };

      };


      /**************************************************
      * Event handlers so that the UIController can act *
      * as the single source of truth                   *
      **************************************************/

      var handleMouseDown = function(event) {

        switch (event.which) {
          case 1:
            controller.pointerLeft = true;
            break;
          case 2:
            controller.pointerMiddle = true;
            break;
          case 3:
            controller.pointerRight = true;
            break;
        }

        if (controller.currentState && typeof controller.currentState.mouseDown === 'function') {
          controller.currentState.mouseDown(event);
        }

      };

      var handleMouseUp = function(event) {

        controller.distanceSinceLastPointerLeft = 0;

        switch (event.which) {
          case 1:
            controller.pointerLeft = false;
            break;
          case 2:
            controller.pointerMiddle = false;
            break;
          case 3:
            controller.pointerRight = false;
            break;
        }

        if (controller.draggedElement !== null) {
          //TODO used?
          controller.dropFn(controller.draggedElement);
        }

        if (controller.currentState && typeof controller.currentState.mouseUp === 'function') {
          controller.currentState.mouseUp(event);
        }

      };

      var handleMouseMove = function(event) {

        controller.pointerX = event.clientX;
        controller.pointerY = event.clientY;

        if (controller.currentState && typeof controller.currentState.mouseMove === 'function') {
          controller.currentState.mouseMove(event);
        }

      };

      var handleScroll = function(event) {

        controller.scrollX = window.scrollX;
        controller.scrollY = window.scrollY;

        if (controller.currentState && typeof controller.currentState.scroll === 'function') {
          controller.currentState.scroll(event);
        }

      };

      var handleResize = function(event) {

        if (controller.currentState && typeof controller.currentState.resize === 'function') {
          controller.currentState.resize(event);
        }

      };

      var handleDataModelChange = function(dataModel) {

        controller.dataModel = dataModel;

        if (controller.currentState && typeof controller.currentState.dataChange === 'function') {

          controller.currentState.dataChange();

        }

      };


      /*********************************************
      * Initialize the controller's internal state *
      *********************************************/

      // Callbacks for UI state transitions
      this.layoutFn = layoutFn;

      // Data and state tracking
      this.dataModel = [];
      this.editMode = false;
      this.expandedMode = false;
      this.draggedElement = null;

      // Actual state machine details
      //TODO not consistent with what the states name themselves.
      this.STATES = {
        'REST': new UIRestState(),
        'LAYOUT': new UILayoutState(),
        'UPDATE': new UIUpdateState()
      };
      this.currentState = null;

      // Input parameters
      this.pointerX = -1;
      this.pointerY = -1;

      this.pointerLeft = false;
      this.pointerMiddle = false;
      this.pointerRight = false;

      this.scrollX = 0;
      this.scrollY = 0;

      //TODO cleanup!
      //TODO these are making testing this controller quite hard.
      //Strongly consider passing these in as observables.
      //Also, any particular reason these are not jQuery?
      document.addEventListener('mousedown', handleMouseDown, false);
      document.addEventListener('mouseup', handleMouseUp, false);
      document.addEventListener('mousemove', handleMouseMove, false);
      document.addEventListener('scroll', handleScroll, false);
      window.addEventListener('resize', handleResize, false);
      dataModelObservable.subscribe(handleDataModelChange);

      //TODO this introduces a nasty null pattern on currentState,
      //How else shall we do this? Maybe a WAITING_FOR_DATAMODEL state?
      dataModelObservable.first().subscribe(function() {
        controller.transitionTo('LAYOUT');
      });

    };

    UIController.prototype.getState = function() {
      if (!this.currentState) {
        return null; //TODO see above comment about null pattern.
      } else {
        return this.currentState.getState();
      }
    };

    UIController.prototype.transitionTo = function(newState) {
      this.currentState = this.STATES[newState];
      this.currentState.enter();
    };

    UIController.prototype.setExpandedMode = function(expandedMode) {
      this.expandedMode = expandedMode;
    };

    UIController.prototype.setEditMode = function(editMode) {
      this.editMode = editMode;
      this.transitionTo('LAYOUT');
    };

    return {

      // Initialize a UIController with the given layout function
      // and data model observable. The output of the dataModelObservable
      // will be used as arguments to layoutFn, and is expected to be
      // an array.
      initialize: function(layoutFn, dataModelObservable) {
        return new UIController(layoutFn, dataModelObservable);
      }

    };

  });

})();
