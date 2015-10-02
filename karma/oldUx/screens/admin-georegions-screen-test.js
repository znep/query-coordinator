describe('admin-georegions-screen', function() {
  var components = blist.namespace.fetch('blist.components');
  var TestUtils = React.addons.TestUtils;

  beforeEach(function() {
    this.target = $('<div/>').appendTo(document.body).get(0);
    this.shallowRenderer = TestUtils.createRenderer();
  });

  afterEach(function() {
    $(this.target).remove();
  });

  describe('commonNS.georegionsSelected', function() {
    var renderPageStub;

    beforeEach(function() {
      $.fn.jqmHide = sinon.stub();
      renderPageStub = sinon.stub(blist.namespace.fetch('blist.georegions'), 'renderPage');
    });

    afterEach(function() {
      renderPageStub.restore();
    });

    var georegionsSelected = blist.namespace.fetch('blist.common.georegionSelected');

    it('exists', function() {
      expect(_.isFunction(georegionsSelected)).to.eq(true);
    });

    it('renders the page', function() {
      georegionsSelected();
      expect(renderPageStub).to.have.been.calledOnce;
    });

    it('adds an item to georegions', function() {
      var stubItem = {};
      georegionsSelected(stubItem);
      expect(blist.namespace.fetch('blist.georegions').georegions).to.include(stubItem);
    });
  });

});
