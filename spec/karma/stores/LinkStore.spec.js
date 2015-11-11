describe('LinkStore', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;

  function dispatchAction(action, payload) {
    var payload = _.extend({action: action}, payload);
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
        dispatchAction(Actions.LINK_MODAL_OPEN, {editorId: 'yes'});
      });

      it('should update visibility', function() {
        assert(storyteller.linkStore.getVisibility());
      });

      it('should remember the editor ID that opened it', function() {
        assert.equal(storyteller.linkStore.getEditorId(), 'yes');
      });

      it('should emit a change', function(done) {
        storyteller.linkStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_MODAL_OPEN, {editorId: 'yes'});
      });
    });
  });

  describe('Actions.LINK_MODAL_CLOSE', function() {
    describe('when given no payload', function() {
      beforeEach(function() {
        dispatchAction(Actions.LINK_MODAL_CLOSE);
      });

      it('should reset all state variables', function() {
        assert.isNull(storyteller.linkStore.getEditorId());
        assert.isNull(storyteller.linkStore.getInputs());

        assert.isFalse(storyteller.linkStore.getVisibility());
        assert.isFalse(storyteller.linkStore.getValidity());
        assert.isFalse(storyteller.linkStore.getAccepted());
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
        assert.deepEqual(storyteller.linkStore.getInputs(), {
          link: 'link',
          text: 'text',
          openInNewWindow: true
        });
      });

      it('should set validity', function() {
        assert.equal(storyteller.linkStore.getValidity(), true);
      });

      it('should emit a change', function(done) {
        storyteller.linkStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_MODAL_UPDATE, {text: '', link: '', openInNewWindow: false});
      });
    });
  });

  describe('Actions.LINK_MODAL_ACCEPT', function() {
    describe('when given no payload', function() {
      it('should set accepted state', function() {
        dispatchAction(Actions.LINK_MODAL_ACCEPT);
        assert(storyteller.linkStore.getAccepted());
      });

      it('should emit a change', function(done) {
        storyteller.linkStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_MODAL_ACCEPT);
      });
    });
  });
});
