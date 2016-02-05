describe('DOMPurify extensions', function() {
  'use strict';

  describe('link rel=noreferrer adder', function() {
    var $resultLink;

    function purify(html) {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [ 'a' ],
        ALLOWED_ATTR: [ 'href', 'rel' ]
      });
    }

    function useHtml(html) {
      beforeEach(function() {
        $resultLink = $(purify(html));
      });
    }

    function expectRelToBe(rel) {
      it('should result in a rel attribute with words: ' + rel, function() {
        expect(
          _.words($resultLink.attr('rel'))
        ).to.deep.equal(_.words(rel));
      });
    }

    describe('on a link with no rel attr', function() {
      useHtml('<a href="https://socrata.com">socrata</a>');
      expectRelToBe('noreferrer');
    });
    describe('on a link with a rel attr with no noreferrer', function() {
      useHtml('<a href="https://socrata.com" rel="external nofollow">socrata</a>');
      expectRelToBe('external nofollow noreferrer');
    });
    describe('on a link with a rel attr with noreferrer already set', function() {
      useHtml('<a href="https://socrata.com" rel="external nofollow noreferrer">socrata</a>');
      expectRelToBe('external nofollow noreferrer');
    });
  });

});
