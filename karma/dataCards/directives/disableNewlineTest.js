describe('disableNewline directive', function() {
  'use strict';

  var testHelpers;
  var $rootScope;

  beforeEach(module('dataCards'));
  beforeEach(module('dataCards.directives'));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  function createDisableNewlineTextarea(scope) {
    var disableNewlineTextarea = '<textarea ng-model="value" disable-newline></textarea>';
    var element = testHelpers.TestDom.compileAndAppend(disableNewlineTextarea, scope);

    $rootScope.$digest();
    return element;
  }

  describe('disableNewline textarea', function() {
    var scope;
    var textarea;
    var spy;

    beforeEach(function() {
      scope = $rootScope.$new();
      textarea = createDisableNewlineTextarea(scope);
      spy = sinon.spy(scope, '$broadcast');
    });

    it('should disable the <enter> keypress event default behavior', function() {
      var enterEvent = $.Event('keypress', {
        which: 13,
        keyCode: 13
      });
      textarea.trigger(enterEvent);
      expect(enterEvent.isDefaultPrevented()).to.be.true
    });

    it('should handle the \\n newline character', function() {
      textarea.val('\n').trigger('input');
      expect(textarea.val()).to.be.empty;
    });

    it('should handle the \\r newline character', function() {
      textarea.val('\r').trigger('input');
      expect(textarea.val()).to.be.empty;
    });

    it('should handle the \\r\\n newline character', function() {
      textarea.val('\r\n').trigger('input');
      expect(textarea.val()).to.be.empty;
    });

    it('should properly add non newline characters', function() {
      textarea.val('a b c d').trigger('input');
      expect(textarea.val()).to.equal('a b c d');
    });

    it('should handle an escaped newline character', function() {
      textarea.val('\\n').trigger('input');
      expect(textarea.val()).to.equal('\\n');
    });

    it('should handle newlines at the beginning of a string', function() {
      textarea.val('\n\n\nabc').trigger('input');
      expect(textarea.val()).to.equal('abc');
    });

    it('should handle newlines in the middle of a string', function() {
      textarea.val('abc\n\n\ndef').trigger('input');
      expect(textarea.val()).to.equal('abcdef');
    });

    it('should handle newlines at the end of a string', function() {
      textarea.val('abc\n\n\n').trigger('input');
      expect(textarea.val()).to.equal('abc');
    });

    it('should handle complex combinations of newlines and characters', function() {
      textarea.val('\na\n\n\r\nb  c\r\n  \nde\n\nfg').trigger('input');
      expect(textarea.val()).to.equal('ab  c  defg');
    });

    it('should handle pasting in newlines to a non-empty textarea', function() {
      textarea.val('abcdef');
      textarea.val(textarea.val() + '\n\n\n').trigger('input');
      expect(textarea.val()).to.equal('abcdef');
    });

    // Phantom does not have 'selectionStart/selectionEnd'
    (/PhantomJS/.test(navigator.userAgent) ? xit : it)('should properly position the cursor when escaping newlines', function() {
      textarea.val('a\n\n\nb').trigger('input');
      expect(textarea[0].selectionEnd).to.equal(2);
    });

    (/PhantomJS/.test(navigator.userAgent) ? xit : it)('should properly position the cursor when escaping newlines', function() {
      textarea.val('\n\na\n\nb\n\nc\n').trigger('input');
      expect(textarea[0].selectionEnd).to.equal(3);
    });

    it('should broadcast an "elastic:adjust" event', function() {
      textarea.trigger('input');
      spy.should.have.been.calledWith('elastic:adjust');
    });
  });
});
