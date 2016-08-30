/**
 * 'Add child component' action.
 */
$.cf.edit.registerAction('move', {
  // Caller must supply via childID or child
  childID: undefined,

  // Caller must supply via newContainerID or container
  newContainerID: undefined,

  // Optional ID of new following sibling, caller may supply via newPositionID or position
  newPositionID: undefined,

  // Rollback container, caller must supply via oldContainerID or oldContainer
  oldContainerID: undefined,

  // Optional rollback position, supplied via oldPositionID or oldPosition
  oldPositionID: undefined,

  initialize: function(options) {
    var child = options.child;
    this.childID = (child && child.id) || options.childID;
    if (!this.childID)
      throw 'Cannot perform move without child reference';

    this.newContainerID = options.newContainerID || (options.newContainer && options.newContainer.id);
    if (!this.newContainerID)
      throw 'Cannot perform move without new container reference';
    this.newPositionID = options.newPositionID || (options.newPosition && options.newPosition.id);

    this.oldContainerID = options.oldContainerID || (options.oldContainer && options.oldContainer.id);
    if (!this.oldContainerID)
      throw 'Cannot perform move without old container reference';
    this.oldPositionID = options.oldPositionID || (options.oldPosition && options.oldPosition.id);
  },

  commit: function() {
    var editObj = this;
    // Obtain the child
    var children = $.component(editObj.childID, true);
    if (_.isEmpty(children)) {
      throw new Error('Cannot commit move because component ' + editObj.childID + ' has disappeared');
    }

    _.each(children, function(child) {
      // Obtain new container
      var container = $.component(editObj.newContainerID, child._componentSet);
      if (!container) {
        throw new Error('Cannot commit move because container ' + editObj.newContainerID +
          ' has disappeared');
      }

      // Obtain position
      if (editObj.newPositionID) {
        var position = $.component(editObj.newPositionID, child._componentSet);
        if (!position) {
          throw new Error('Cannot commit add because following sibling ' +
            editObj.positionID + ' has disappeared');
        }
      }

      // Perform the actual move
      container.add(child, position);
    });
  },

  rollback: function() {
    var editObj = this;
    // Obtain the child
    var children = $.component(editObj.childID, true);
    if (_.isEmpty(children)) {
      throw new Error('Cannot undo move because component ' + editObj.childID + ' has disappeared');
    }

    _.each(children, function(child) {
      // Obtain new container
      var container = $.component(editObj.oldContainerID, child._componentSet);
      if (!container) {
        throw new Error('Cannot undo move because container ' + editObj.oldContainerID +
          ' has disappeared');
      }

      // Obtain position
      if (editObj.oldPositionID) {
        var position = $.component(editObj.oldPositionID, child._componentSet);
        if (!position) {
          throw new Error('Cannot undo move because following sibling ' +
            editObj.oldPositionID + ' has disappeared');
        }
      }

      // Perform the actual move
      container.add(child, position);
    });
  }
});
