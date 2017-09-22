import { expect, assert } from 'chai';
import React from 'react';
import TestUtils from 'react-dom/test-utils';

xdescribe('admin-georegions-screen', function() {
  // File doesn't export any functionality, so it can't be tested as-is
  // TODO: break into smaller units to test individually

  beforeEach(function() {
    this.target = $('<div id="react-modal"/>').appendTo(document.body).get(0);
  });

  afterEach(function() {
    $(this.target).remove();
  });

  describe('commonNS.georegionsSelected', function() {
    beforeEach(function() {
      $.fn.jqmShow = sinon.stub();
      $.fn.jqmHide = sinon.stub();
      this.renderPageStub = sinon.stub(blist.namespace.fetch('blist.georegions'), 'renderPage');
      this.clearFlashMessageStub = sinon.stub(blist.namespace.fetch('blist.georegions'), 'clearFlashMessage');
      sinon.stub($, 'ajax').returns({});
    });

    afterEach(function() {
      this.renderPageStub.restore();
      this.clearFlashMessageStub.restore();
      $.ajax.restore();
    });

    var georegionsSelected = blist.namespace.fetch('blist.common.georegionSelected');

    it('exists', function() {
      expect(_.isFunction(georegionsSelected)).to.eq(true);
    });

    it('renders the configure boundary modal', function() {
      georegionsSelected('four-four', 'My Boundary');
      sinon.assert.calledOnce(this.clearFlashMessageStub);
      sinon.assert.calledOnce($.fn.jqmShow);
      expect($(this.target)).to.contain('')
    });

  });

});
