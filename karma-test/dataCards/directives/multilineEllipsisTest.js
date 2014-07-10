describe("multilineEllipsis directive", function() {
  var scope, lotsOfText, testHelpers;
  lotsOfText = _.times(100, function() { return "This is a test of the emergency broadcast system. This is only a test. "; });

  beforeEach(module('test'));
  beforeEach(module('dataCards.directives'));

  beforeEach(inject(['$rootScope', 'testHelpers', function(_$rootScope, _testHelpers) {
    scope = _$rootScope.$new();
    testHelpers = _testHelpers;
  }]));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('with a max-lines, tolerance and a lot of text', function() {
    var html, el, content;

    beforeEach(function() {
      html = '<div ></div>';
      el = testHelpers.TestDom.compileAndAppend(html, scope);
      content = $('<div class="page-description" expanded="false" multiline-ellipsis max-lines="2" tolerance="2" text="{0}">'.format(lotsOfText));
      el.append(content);
      content.text(lotsOfText);
    });

    it('should show an ellipsis when there are more than two lines of text and the height is 24 pixels', function() {
      content.dotdotdot({height: 24, tolerance: 2});
      expect(content.text().indexOf('...') >= 0).to.equal(true);
    });

    it('should show the full amount of text and no ellipsis when the height is infinite', function() {
      content.dotdotdot({height: Infinity, tolerance: 2});
      expect(content.text().indexOf('...') >= 0).to.equal(false);
    });

  });

});
