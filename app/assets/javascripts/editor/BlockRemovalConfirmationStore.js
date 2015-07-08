;(function() {
  'use strict';

  /* Responsible for:
   * - Tracking which blocks need confirmation to remove them
   *
   * Registers to:
   * - STORY_CREATE
   * - BLOCK_UPDATE_COMPONENT
   *
   * Provides:
   * - needsConfirmation(blockId)
   *
   */
  function BlockRemovalConfirmationStore() {

    var self = this;
    var _blockNeedsConfirmation = [];


    _.extend(this, new Store());

    window.dispatcher.register(function(payload) {
      var action = payload.action;

      switch (action) {
        case Constants.STORY_CREATE:
          payload.data.blocks.forEach(function(block) {
            _blockNeedsConfirmation.push(block.id);
          });
          self._emitChange();
          break;

        case Constants.BLOCK_UPDATE_COMPONENT:
          _blockNeedsConfirmation.push(payload.blockId);
          self._emitChange();
          break;
      }
    });

    /*
     * @param   {num}        blockId
     * @return  {boolean}    true if the block needs a confirmation dialog
     */
    this.needsConfirmation = function(blockId) {
      return _.contains(_blockNeedsConfirmation, blockId);
    };

  };


  window.BlockRemovalConfirmationStore = BlockRemovalConfirmationStore;
})();
