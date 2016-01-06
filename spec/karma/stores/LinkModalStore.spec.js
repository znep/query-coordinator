describe('LinkModalStore', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;

  function dispatchAction(action, payload) {
    payload = _.extend({action: action}, payload);
    storyteller.dispatcher.dispatch(payload);
  }

  describe('Actions.LINK_MODAL_OPEN', function() {
    describe('when given an incorrect payload', function() {
      it('should throw', function() {
        assert.throws(function() {
          dispatchAction(Actions.LINK_MODAL_OPEN, {});
        });
      });
    });

    describe('when given a valid payload', function() {

      beforeEach(function() {
        dispatchAction(Actions.LINK_MODAL_OPEN, {
          editorId: 'yes',
          text: 'text',
          link: 'link',
          openInNewWindow: 'openInNewWindow'
        });
      });

      it('should update visibility', function() {
        assert(storyteller.linkModalStore.getVisibility());
      });

      it('should remember the editor ID that opened it', function() {
        assert.equal(storyteller.linkModalStore.getEditorId(), 'yes');
      });

      it('should emit a change', function(done) {
        storyteller.linkModalStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_MODAL_OPEN, {
          editorId: 'yes',
          text: 'text',
          link: 'link',
          openInNewWindow: 'openInNewWindow'
        });
      });
    });
  });

  describe('Actions.LINK_MODAL_CLOSE', function() {
    describe('when given no payload', function() {
      beforeEach(function() {
        dispatchAction(Actions.LINK_MODAL_CLOSE);
      });

      it('should reset all state variables', function() {
        assert.isNull(storyteller.linkModalStore.getEditorId());
        assert.isNull(storyteller.linkModalStore.getInputs());

        assert.isFalse(storyteller.linkModalStore.getVisibility());
        assert.isFalse(storyteller.linkModalStore.getValidity());
        assert.isFalse(storyteller.linkModalStore.getAccepted());
      });
    });
  });

  describe('Actions.LINK_MODAL_UPDATE', function() {
    describe('when given an incorrect payload', function() {
      it('should throw when missing the text input', function() {
        assert.throws(function() {
          dispatchAction(Actions.LINK_MODAL_UPDATE, {link: '', openInNewWindow: ''});
        });
      });

      it('should throw when missing the link input', function() {
        assert.throws(function() {
          dispatchAction(Actions.LINK_MODAL_UPDATE, {text: '', openInNewWindow: ''});
        });
      });

      it('should throw when missing the checkbox input', function() {
        assert.throws(function() {
          dispatchAction(Actions.LINK_MODAL_UPDATE, {link: '', text: ''});
        });
      });
    });

    describe('when given a valid payload', function() {
      beforeEach(function() {
        dispatchAction(Actions.LINK_MODAL_UPDATE, {
          link: 'link',
          text: 'text',
          openInNewWindow: true
        });
      });

      it('should set inputs', function() {
        assert.deepEqual(storyteller.linkModalStore.getInputs(), {
          link: 'link',
          text: 'text',
          openInNewWindow: true
        });
      });

      it('should set validity', function() {
        assert.equal(storyteller.linkModalStore.getValidity(), true);
      });

      it('should emit a change', function(done) {
        storyteller.linkModalStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_MODAL_UPDATE, {text: '', link: '', openInNewWindow: false});
      });
    });
  });

  describe('Actions.LINK_MODAL_ACCEPT', function() {
    describe('when given no payload', function() {
      it('should throw an error', function() {
        assert.throws(function() {
          dispatchAction(Actions.LINK_MODAL_ACCEPT);
        });
      });
    });

    describe('when given a valid payload', function() {
      it('should set accepted state', function() {
        dispatchAction(Actions.LINK_MODAL_ACCEPT, {text: '', link: '', openInNewWindow: false});
        assert(storyteller.linkModalStore.getAccepted());
      });

      it('should emit a change', function(done) {
        storyteller.linkModalStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_MODAL_ACCEPT, {text: '', link: '', openInNewWindow: false});
      });
    });
  });
});
