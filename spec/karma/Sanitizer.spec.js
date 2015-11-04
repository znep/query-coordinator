describe('Sanitizer.sanitizeElement()', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;
  var Sanitizer = storyteller.Sanitizer;

  var returned;
  function useHtml(htmlOrDomNode) {
    beforeEach(function() {
      var domNode = _.isString(htmlOrDomNode) ? $(htmlOrDomNode)[0] : htmlOrDomNode;
      returned = Sanitizer.sanitizeElement(domNode);
    });
  }

  describe('given an element node that is safe to use', function() {
    useHtml('<div>');
    it('should return an element of the same type', function() {
      assert.equal(returned.nodeName, 'DIV');
    });

    describe('with safe attrs', function() {
      useHtml('<a href="good" style="color:green">');
      it('should preserve the safe attrs', function() {
        assert.equal(returned.getAttribute('href'), 'good');
        assert.isNull(returned.getAttribute('style'));
      });
    });

    describe('with unsafe attrs', function() {
      useHtml('<div href="bad" style="color:red">');
      it('should remove the unsafe attrs', function() {
        assert.isNull(returned.getAttribute('href'));
        assert.isNull(returned.getAttribute('style'));
      });
    });
  });

  describe('given a paragraph node', function() {
    useHtml('<p>');
    it('should convert the node into a <div> node.', function() {
      assert.equal(returned.nodeName, 'DIV');
    });
  });

  describe('given an element node that is not safe to use', function() {
    useHtml('<script>');
    it('should return a document fragment', function() {
      assert.equal(returned.nodeName, '#document-fragment');
    });

    // #document-fragment cannot have attrs, hence no tests for that case.
  });

  describe('given a text node', function() {
    useHtml(document.createTextNode('text'));
    it('should return a text node with the correct text', function() {
      assert.equal(returned.nodeName, '#text');
      assert.equal(returned.textContent, 'text');
    });
  });

  describe('given a document fragment', function() {
    useHtml(document.createDocumentFragment());
    it('should return a document fragment', function() {
      assert.equal(returned.nodeName, '#document-fragment');
    });
  });

  describe('given some other node type', function() {
    useHtml(document.createComment('foo'));
    it('should return null', function() {
      assert.isNull(returned);
    });
  });

  describe('given an element node with safe and unsafe children', function() {
    useHtml('<div><span>stuff</span><a href="http://good">foo</a><script></script></div>');
    it('should rebuild the DOM entire tree recursively', function() {
      assert.equal(returned.nodeName, 'DIV');
      assert.equal($(returned).html(), 'stuff<a href="http://good">foo</a>');
    });
  });

  describe('given something that will cause an exception', function() {
    var evilNode = {};
    var evilNodeDidEvil;
    Object.defineProperty(evilNode, 'nodeType', {
      get: function() {
        evilNodeDidEvil = true;
        throw new Error('MUAHAHA');
      }
    });

    beforeEach(function() {
      evilNodeDidEvil = false;
      sinon.stub(window.console, 'warn');
    });
    afterEach(function() {
      window.console.warn.restore();
    });

    useHtml(evilNode);

    it('should return a document fragment with no children', function() {
      assert.equal(returned.nodeName, '#document-fragment');
      assert.lengthOf(returned.childNodes, 0);
    });

    it('should log a warning to the console', function() {
      sinon.assert.called(console.warn);
    });
  });
});
