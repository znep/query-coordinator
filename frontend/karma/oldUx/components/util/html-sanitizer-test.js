describe('htmlSanitizer', function() {
  'use strict';

  var sanitizerUtils;

  beforeEach(function(){
    sanitizerUtils = blist.namespace.fetch('blist.util.htmlSanitizer');
  });

  describe('sanitizeHtmlPermissive', function() {

    it('removes a script tag', function() {
      var inputHtml = '<h3>Title text</h3><script type="text/javascript">alert("harmful stuff");</script>'
      var sanitizedHtml = sanitizerUtils.sanitizeHtmlPermissive(inputHtml);
      expect(sanitizedHtml).not.to.match(/script/);
    });

    it('strips newlines from html', function() {
      var inputHtml = '<ol>  \n  <li>Thing One</li>\n <li>Thing Two</li>\n</ol>';
      var sanitizedHtml = sanitizerUtils.sanitizeHtmlPermissive(inputHtml);
      expect(sanitizedHtml).not.to.match(/\n/);
    });

    it('moves space outside of tag if content has a trailing space', function() {
      var inputHtml = '<b>stuff </b> <span>stuff </span>more';
      var sanitizedHtml = sanitizerUtils.sanitizeHtmlPermissive(inputHtml);
      expect(sanitizedHtml).to.equal('<b>stuff</b>  <span>stuff</span> more');
    });

  });


});
