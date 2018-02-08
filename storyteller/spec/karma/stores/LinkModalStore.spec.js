import _ from 'lodash';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import Dispatcher from 'editor/Dispatcher';
import LinkModalStore from 'editor/stores/LinkModalStore';

describe('LinkModalStore', function() {

  var dispatcher;
  var linkModalStore;

  function dispatchAction(action, payload) {
    payload = _.extend({action: action}, payload);
    dispatcher.dispatch(payload);
  }

  beforeEach(function() {
    dispatcher = new Dispatcher();
    StoreAPI.__Rewire__('dispatcher', dispatcher);
    linkModalStore = new LinkModalStore();
  });

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
        assert(linkModalStore.getVisibility());
      });

      it('should remember the editor ID that opened it', function() {
        assert.equal(linkModalStore.getEditorId(), 'yes');
      });

      it('should emit a change', function(done) {
        linkModalStore.addChangeListener(function() {
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
        assert.isNull(linkModalStore.getEditorId());
        assert.isNull(linkModalStore.getInputs());

        assert.isFalse(linkModalStore.getVisibility());
        assert.isFalse(linkModalStore.getValidity());
        assert.isFalse(linkModalStore.getAccepted());
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
        assert.deepEqual(linkModalStore.getInputs(), {
          link: 'link',
          text: 'text',
          openInNewWindow: true
        });
      });

      it('should set validity', function() {
        assert.equal(linkModalStore.getValidity(), true);
      });

      it('should emit a change', function(done) {
        linkModalStore.addChangeListener(function() {
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
        assert(linkModalStore.getAccepted());
      });

      it('should emit a change', function(done) {
        linkModalStore.addChangeListener(function() {
          done();
        });

        dispatchAction(Actions.LINK_MODAL_ACCEPT, {text: '', link: '', openInNewWindow: false});
      });
    });
  });
});
