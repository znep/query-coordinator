describe('admin-georegions-screen', function() {
  var components = blist.namespace.fetch('blist.components');
  var TestUtils = React.addons.TestUtils;

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
    });

    afterEach(function() {
      this.renderPageStub.restore();
      this.clearFlashMessageStub.restore();
    });

    var georegionsSelected = blist.namespace.fetch('blist.common.georegionSelected');

    it('exists', function() {
      expect(_.isFunction(georegionsSelected)).to.eq(true);
    });

    it('renders the configure boundary modal', function() {
      georegionsSelected('four-four');
      expect(this.clearFlashMessageStub).to.have.been.calledOnce;
      expect($.fn.jqmShow).to.have.been.calledOnce;
      expect($(this.target)).to.contain('')
    });

    it('adds an item to georegions', function() {
      var stubItem = {};
      georegionsSelected(stubItem);
      expect(blist.namespace.fetch('blist.georegions').georegions).to.include(stubItem);
    });
  });

});
