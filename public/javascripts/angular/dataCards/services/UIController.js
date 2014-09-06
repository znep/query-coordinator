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
            if (controller.expandedMode) {
              controller.transitionTo('LAYOUT');
            }
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

            controller.layoutFn.apply(controller, controller.dataModel);

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
            if (controller.expandedMode) {
              controller.transitionTo('LAYOUT');
            }
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
            if (controller.expandedMode) {
              controller.transitionTo('LAYOUT');
            }
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

        controller.pointerTarget = event.target;

        if (controller.currentState && typeof controller.currentState.mouseDown === 'function') {
          controller.currentState.mouseDown(event);
        }

      };

      var handleMouseUp = function(event) {

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

        controller.pointerTarget = event.target;

        if (controller.currentState && typeof controller.currentState.mouseUp === 'function') {
          controller.currentState.mouseUp(event);
        }

      };

      var handleMouseMove = function(event) {

        controller.pointerX = event.clientX;
        controller.pointerY = event.clientY;
        controller.pointerTarget = event.target;

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

      this.editMode = false;
      this.expandedMode = false;

      this.layoutFn = layoutFn;

      this.STATES = {
        'REST': new UIRestState(),
        'LAYOUT': new UILayoutState(),
        'UPDATE': new UIUpdateState()
      };

      this.currentState = null;

      this.dataModel = null;

      this.pointerX = -1;
      this.pointerY = -1;
      this.pointerLeft = false;
      this.pointerMiddle = false;
      this.pointerRight = false;

      this.scrollX = 0;
      this.scrollY = 0;

      document.addEventListener('mousedown', handleMouseDown, false);
      document.addEventListener('mouseup', handleMouseUp, false);
      document.addEventListener('mousemove', handleMouseMove, false);
      document.addEventListener('scroll', handleScroll, false);
      window.addEventListener('resize', handleResize, false);
      dataModelObservable.subscribe(handleDataModelChange);

      this.transitionTo('LAYOUT');

    };

    UIController.prototype.getState = function() {
      console.log(this.currentState);
      return this.currentState.getState();
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
    };

    return {

      initialize: function(layoutFn, dataModelObservable) {
        return new UIController(layoutFn, dataModelObservable);
      }

    };

  });

})();