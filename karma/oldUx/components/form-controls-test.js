describe('FormControls', function() {

  var components = blist.namespace.fetch('blist.components');
  var FormControls = components.FormControls;
  var TestUtils = React.addons.TestUtils;
  var findByTag = TestUtils.findRenderedDOMComponentWithTag;
  var findAllByTag = TestUtils.scryRenderedDOMComponentsWithTag;

  beforeEach(function() {
    this.shallowRenderer = TestUtils.createRenderer();
    sinon.stub($, 't', function(key) {
      return 'Translation for: ' + key;
    });
    this.createElement = function(addProps) {
      var props = _.extend({}, this.props, addProps);
      return React.createElement(FormControls, props);
    };
    this.renderIntoDocument = function(props) {
      return TestUtils.renderIntoDocument(this.createElement(props));
    };
  });

  afterEach(function() {
    $.t.restore();
  });

  it('exists', function() {
    expect(FormControls).to.exist;
  });

  it('renders', function() {
    this.shallowRenderer.render(this.createElement());
    var result = this.shallowRenderer.getRenderOutput();
    expect(result).to.be.an.elementOfType('div');
  });

  describe('cancel button', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ onCancel: _.noop });
    });

    it('renders a button', function() {
      var buttons = findAllByTag(this.node, 'button');
      expect(buttons).to.have.length(1);
    });

    it('renders with the appropriate text', function() {
      var button = findByTag(this.node, 'button').getDOMNode();
      expect(button).to.have.className('button').
        and.to.have.textContent('Translation for: core.dialogs.cancel');
    });
  });

  describe('save button', function() {
    beforeEach(function() {
      this.node = this.renderIntoDocument({ onSave: _.noop });
    });

    it('renders a button', function() {
      var buttons = findAllByTag(this.node, 'button');
      expect(buttons).to.have.length(1);
    });

    it('renders with the appropriate text', function() {
      var button = findByTag(this.node, 'button').getDOMNode();
      expect(button).to.have.className('button').
        and.to.have.textContent('Translation for: core.dialogs.save').
        and.to.not.have.className('disabled');
    });

    it('should not be disabled', function() {
      var button = findByTag(this.node, 'button').getDOMNode();
      expect(button.attributes.disabled).to.not.exist;
    });

    describe('disabled', function() {
      beforeEach(function() {
        var node = this.renderIntoDocument({
          onSave: _.noop,
          saveDisabled: true
        });
        this.button = findByTag(node, 'button').getDOMNode();
      });

      it('renders with disabled attribute', function() {
        expect(this.button.attributes.disabled).to.exist;
      });

      it('renders with disabled class', function() {
        expect(this.button).to.have.className('disabled');
      });
    });
  });
});
