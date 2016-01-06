describe('LinkTipStore', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;

  function dispatchAction(action, payload) {
    payload = _.extend({action: action}, payload);
    storyteller.dispatcher.dispatch(payload);
  }

  describe('Actions.LINK_TIP_OPEN', function() {
    describe('when given an incorrect payload', function() {
      it('should throw', function() {
        assert.throws(function() {
          dispatchAction(Actions.LINK_TIP_OPEN, {});
        });
      });
    });

    describe('when given a valid payload', function() {
      var payload = {
        text: 'text',
        link: 'link',
        openInNewWindow: true,
        editorId: 'id',
        boundingClientRect: 'boundingClientRect'
      };

      beforeEach(function() {
        dispatchAction(Actions.LINK_TIP_OPEN, payload);
      });

      it('should emit a change', function(done) {
        storyteller.linkTipStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_TIP_OPEN, payload);
      });

      it('should update visibility to true', function() {
        assert.isTrue(storyteller.linkTipStore.getVisibility());
      });

      it('should update inputs', function() {
        assert.deepEqual(storyteller.linkTipStore.getInputs(), {
          text: 'text',
          link: 'link',
          openInNewWindow: true
        });
      });

      it('should update bounding client rectangle', function() {
        assert.deepEqual(storyteller.linkTipStore.getBoundingClientRect(), 'boundingClientRect');
      });

      it('should update editor ID', function() {
        assert.equal(storyteller.linkTipStore.getEditorId(), 'id');
      });
    });
  });

  describe('Actions.LINK_MODAL_ACCEPT', function() {
    describe('when given an incorrect payload', function() {
      it('should throw', function() {
        assert.throws(function() {
          dispatchAction(Actions.LINK_MODAL_ACCEPT);
        });
      });
    });

    describe('when given a valid payload', function() {
      var payload = {
        text: 'text',
        link: 'link',
        openInNewWindow: false
      };

      beforeEach(function() {
        dispatchAction(Actions.LINK_MODAL_ACCEPT, payload);
      });

      it('should emit a change', function(done) {
        storyteller.linkTipStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_MODAL_ACCEPT, payload);
      });

      it('should update inputs', function() {
        assert.deepEqual(storyteller.linkTipStore.getInputs(), {
          text: 'text',
          link: 'link',
          openInNewWindow: false
        });
      });
    });
  });

  describe('Actions.LINK_TIP_REMOVE', function() {
    describe('when given no payload', function() {
      beforeEach(function() {
        dispatchAction(Actions.LINK_TIP_REMOVE);
      });

      it('should emit a change', function(done) {
        storyteller.linkTipStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_TIP_REMOVE);
      });

      it('should update the removal boolean value', function() {
        var id = storyteller.linkTipStore.getEditorId();
        assert.isTrue(storyteller.linkTipStore.shouldRemoveLink(id));
      });
    });
  });

  describe('Actions.LINK_TIP_CLOSE', function() {
    describe('when given no payload', function() {
      beforeEach(function() {
        dispatchAction(Actions.LINK_TIP_CLOSE);
      });

      it('should emit a change', function(done) {
        storyteller.linkTipStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_TIP_CLOSE);
      });

      it('should update visibility', function() {
        assert.isFalse(storyteller.linkTipStore.getVisibility());
      });
    });
  });
});
