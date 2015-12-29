describe('Modal jQuery plugin', function() {
  var node;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    node = testDom.append('<div>');
  });

  it('should return `this` for chaining', function() {
    assert.equal(node.modal(), node);
  });

  it('should add the .modal class', function() {
    node.modal();
    assert.isTrue(node.hasClass('modal'));
  });

  it('should start off hidden', function() {
    node.modal();
    assert.isTrue(node.hasClass('hidden'));
  });

  it('should incorporate the title', function() {
    node.modal({
      title: 'foobar'
    });
    assert.include(node.text(), 'foobar');
  });

  it('should incorporate the contents', function() {
    var content = $('<div>', { 'class': 'foo' }).text('foobar');
    node.modal({
      content: content
    });

    assert.include(node.find('.foo').text(), 'foobar');
  });

  describe('after a second call to modal()', function() {
    beforeEach(function() {
      node.modal({
        title: 'old title',
        content: 'old content'
      });
      node.modal({
        title: 'new title',
        content: 'new content'
      });
    });

    it('should incorporate the new title', function() {
      assert.include(node.text(), 'new title');
    });

    it('should incorporate the new contents', function() {
      assert.include(node.text(), 'new content');
    });
  });

  describe('after modal-open event', function() {
    beforeEach(function() {
      node.modal({
        title: 'test title',
        content: $('<div>')
      });
      node.trigger('modal-open');
    });

    it('should be visible', function() {
      assert.isFalse(node.hasClass('hidden'));
    });

    it('should emit modal-dismissed on overlay click', function(done) {
      node.on('modal-dismissed', function() { done(); });
      node.find('.modal-overlay').click();
    });

    it('should emit modal-dismissed on X click', function(done) {
      node.on('modal-dismissed', function() { done(); });
      node.find('.modal-close-btn').click();
    });

    it('should emit modal-dismissed on ESC', function(done) {
      node.on('modal-dismissed', function() { done(); });
      $(document).triggerHandler($.Event('keyup', { keyCode: 27 }));
    });

    it('after modal-close event should become invisible', function() {
      node.trigger('modal-close');
      assert.isTrue(node.hasClass('hidden'));
    });
  });

});
