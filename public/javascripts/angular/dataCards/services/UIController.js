(function() {

  'use strict';

  angular.module('dataCards.services').factory('UIController', function() {

    var UIController = function($scope, layoutFn) {

      var controller = this;

      /******************
      * Valid UI states *
      ******************/

      var UIRestState = function() {

        this.name = 'UIRestState';

        console.log('at rest');

        return {

          getState: function() {
            return this.name;
          },

          mouseDown: function(event) {
            controller.transitionTo(UIUpdateState);
          },

          scroll: function(event) {
            if (controller.expandedMode) {
              controller.transitionTo(UILayoutState);
            }
          }

        };

      };

      var UILayoutState = function() {

        this.name = 'UILayoutState';

        console.log('doing layout');

        controller.layoutFn();

        return {

          getState: function() {
            return this.name;
          },

          mouseDown: function(event) {
            controller.transitionTo(UIUpdateState);
          },

          mouseUp: function(event) {
            controller.transitionTo(UIUpdateState);
          },

          mouseMove: function(event) {
            if (controller.pointerLeft) {
              controller.transitionTo(UIUpdateState);
            } else {
              controller.transitionTo(UIRestState);
            }
          },

          scroll: function(event) {
            if (controller.expandedMode) {
              controller.transitionTo(UILayoutState);
            }
          }

        };

      };

      var UIUpdateState = function() {

        this.name = 'UIUpdateState';

        console.log('doing update');

        return {

          getState: function() {
            return this.name;
          },

          mouseUp: function(event) {
            controller.transitionTo(UILayoutState);
          },

          mouseMove: function(event) {
            controller.transitionTo(UILayoutState);
          },

          scroll: function(event) {
            if (controller.expandedMode) {
              controller.transitionTo(UILayoutState);
            }
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

        if (controller.hasOwnProperty('currentState') &&
            typeof controller.currentState.mouseDown === 'function') {
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

        if (controller.hasOwnProperty('currentState') &&
            typeof controller.currentState.mouseUp === 'function') {
          controller.currentState.mouseUp(event);
        }

      };

      var handleMouseMove = function(event) {

        controller.pointerX = event.clientX;
        controller.pointerY = event.clientY;
        controller.pointerTarget = event.target;

        if (controller.hasOwnProperty('currentState') &&
            typeof controller.currentState.mouseMove === 'function') {
          controller.currentState.mouseMove(event);
        }

      };

      var handleScroll = function(event) {

        controller.scrollX = window.scrollX;
        controller.scrollY = window.scrollY;

        if (controller.hasOwnProperty('currentState') &&
            typeof controller.currentState.scroll === 'function') {
          controller.currentState.scroll(event);
        }

      };

      /*********************************************
      * Initialize the controller's internal state *
      *********************************************/

      this.$scope = $scope;
      this.editMode = $scope.editMode;
      this.expandedMode = $scope.expandedMode;
      this.layoutFn = function() { layoutFn(function() { controller.transitionTo(UIRestState); }); };

      this.currentState = null;

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

      this.transitionTo(UILayoutState);

    };

    UIController.prototype.getState = function() {
      console.log(this.currentState);
      return this.currentState.getState();
    };

    UIController.prototype.transitionTo = function(newState) {
      this.currentState = new newState();
    };

    UIController.prototype.setExpandedMode = function(expandedMode) {
      this.expandedMode = expandedMode;
    };

    UIController.prototype.setEditMode = function(editMode) {
      this.editMode = editMode;
    };

    return {

      initialize: function($scope, layoutFn) {
        return new UIController($scope, layoutFn);
      }

    };

  });

})();