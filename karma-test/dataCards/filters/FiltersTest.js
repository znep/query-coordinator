describe('Filter', function() {

  beforeEach(function() {
    module('socrataCommon.filters');
  });

  describe('singleNewlinesToDoubleNewlines', function() {
    it('should return undefined for non-strings', inject(function($filter) {
      var f = $filter('singleNewlinesToDoubleNewlines');
      expect(f()).to.equal(undefined);
      expect(f(null)).to.equal(undefined);
      expect(f([])).to.equal(undefined);
      expect(f({})).to.equal(undefined);
      expect(f(1)).to.equal(undefined);
      expect(f(function(){})).to.equal(undefined);
    }));

    it('should pass through strings with non-newlines unmolested', inject(function($filter) {
      expect($filter('singleNewlinesToDoubleNewlines')('asd')).to.equal('asd');
    }));

    it('should double single newlines', inject(function($filter) {
      var f = $filter('singleNewlinesToDoubleNewlines');
      expect(f('a\nsd')).to.equal('a\n\nsd');
      expect(f('\nsd')).to.equal('\n\nsd');
      expect(f('a\n')).to.equal('a\n\n');
      expect(f('\n')).to.equal('\n\n');
    }));

    it('should not double double newlines', inject(function($filter) {
      var f = $filter('singleNewlinesToDoubleNewlines');
      expect(f('a\n\nsd')).to.equal('a\n\nsd');
      expect(f('\n\nsd')).to.equal('\n\nsd');
      expect(f('a\n\n')).to.equal('a\n\n');
      expect(f('\n\n')).to.equal('\n\n');
    }));
  });

  describe('linkifyUrls', function() {
    it('should return undefined for non-strings', inject(function($filter) {
      var f = $filter('linkifyUrls');
      expect(f()).to.equal(undefined);
      expect(f(null)).to.equal(undefined);
      expect(f([])).to.equal(undefined);
      expect(f({})).to.equal(undefined);
      expect(f(1)).to.equal(undefined);
      expect(f(function(){})).to.equal(undefined);
    }));

    it('should pass through strings with no links unmolested', inject(function($filter) {
      var f = $filter('linkifyUrls');
      expect(f('a\n\nsd')).to.equal('a\n\nsd');
      expect(f('\n\nsd')).to.equal('\n\nsd');
      expect(f('a\n\n')).to.equal('a\n\n');
      expect(f('\n\n')).to.equal('\n\n');
      var specialString = 'this is a bunch of text, with some special chars: /\\\n\r!@#$%^&*()+_-?><,.{}:"\'[]=\t';
      expect(f(specialString)).to.equal(specialString);
    }));

    it('should linkify links, leaving the rest of the text unmolested', inject(function($filter) {
      var f = $filter('linkifyUrls');
      expect(f('\nhttp://socrata.com\n')).to.equal('\n<a href="http://socrata.com" rel="nofollow">http://socrata.com</a>\n');
      expect(f('http://socrata.com')).to.equal('<a href="http://socrata.com" rel="nofollow">http://socrata.com</a>');
      expect(f('https://socrata.com')).to.equal('<a href="https://socrata.com" rel="nofollow">https://socrata.com</a>');
      expect(f('text https://socrata.com')).to.equal('text <a href="https://socrata.com" rel="nofollow">https://socrata.com</a>');
      expect(f('text https://socrata.com text')).to.equal('text <a href="https://socrata.com" rel="nofollow">https://socrata.com</a> text');
      expect(f('text https://socrata.com. text')).to.equal('text <a href="https://socrata.com" rel="nofollow">https://socrata.com</a>. text');
      expect(f('https://socrata.com text')).to.equal('<a href="https://socrata.com" rel="nofollow">https://socrata.com</a> text');
    }));

    it('should linkify links even if the string is HTML escaped', inject(function($filter) {
      var escapeHtml = $filter('escapeHtml');
      var linkify = $filter('linkifyUrls');

      var escaped = escapeHtml('\nhttp://socrata.com\n');
      expect(linkify(escaped)).to.equal('\n<a href="http://socrata.com" rel="nofollow">http://socrata.com</a>\n');
    }));
  });

  describe('escapeHtml', function() {
    it('should return undefined for non-strings', inject(function($filter) {
      var f = $filter('escapeHtml');
      expect(f()).to.equal(undefined);
      expect(f(null)).to.equal(undefined);
      expect(f([])).to.equal(undefined);
      expect(f({})).to.equal(undefined);
      expect(f(1)).to.equal(undefined);
      expect(f(function(){})).to.equal(undefined);
    }));

    // These tests are transcripted from Mustache's own tests.
    describe('mustache tests', function() {
      it('escaped', inject(function($filter) {
        var f = $filter('escapeHtml');
        // note we removed / from the escaped chars, as it was interfering with autolinking.
        expect(f('Bear > Shark')).to.equal('Bear &gt; Shark');
        expect(f("And even &quot; \"'<>/,")).to.equal('And even &amp;quot; &quot;&#39;&lt;&gt;/,');
      }));
    });
  });
});
