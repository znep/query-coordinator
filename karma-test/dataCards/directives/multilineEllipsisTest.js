describe("multilineEllipsis directive", function() {
  var $rootScope, testHelpers;
  var lotsOfText = _.times(100, function() { return "This is a test of the emergency broadcast system. This is only a test. "; }).join('');

  beforeEach(module('test'));
  beforeEach(module('dataCards'));

  beforeEach(inject(['$rootScope', 'testHelpers', function(_$rootScope, _testHelpers) {
    $rootScope = _$rootScope;
    testHelpers = _testHelpers;
  }]));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('with a max-lines, tolerance and a lot of text', function() {
    describe('with show-more-mode as default', function() {

      describe('with not enough room', function() {
        var el;
        var html = '<div expanded="false" multiline-ellipsis max-lines="2" tolerance="2" text="{{lotsOfText}}">';
        // Can't inject rootScope or testHelpers in describe. Workaround.
        function ensure() {
          if(el) return;
          var scope = $rootScope.$new();
          scope.lotsOfText = lotsOfText;
          el = testHelpers.TestDom.compileAndAppend(html, scope);
        }

        it('should show an ellipsis when there are more than two lines of text and the height is 24 pixels', function() {
          ensure();
          expect(el.text()).to.contain('...');
        });
        it('should not have title text', function() {
          ensure();
          expect(el.find('.content').attr('title')).to.be.empty;
        });
      });

      describe('with enough room', function() {
        var el;
        var html = '<div expanded="false" multiline-ellipsis max-lines="2000" tolerance="2" text="{{lotsOfText}}">';
        // Can't inject rootScope or testHelpers in describe. Workaround.
        function ensure() {
          if(el) return;
          var scope = $rootScope.$new();
          scope.lotsOfText = lotsOfText;
          el = testHelpers.TestDom.compileAndAppend(html, scope);
        }

        it('should show the full amount of text and no ellipsis', function() {
          ensure();
          expect(el.text()).to.equal(lotsOfText);
        });

        it('should not have title text', function() {
          ensure();
          expect(el.find('.content').attr('title')).to.be.empty;
        });
      });
    });

    describe('with show-more-mode as title-attr', function() {
      describe('with not enough room', function() {
        it('should have title text', function() {
          var html = '<div expanded="false" multiline-ellipsis max-lines="2" tolerance="2" text="{{lotsOfText}}" show-more-mode="title-attr">';
          var scope = $rootScope.$new();
          scope.lotsOfText = lotsOfText;
          var el = testHelpers.TestDom.compileAndAppend(html, scope);
          expect(el.text()).to.contain('...');
          expect(el.find('.content').attr('title')).to.equal(lotsOfText);
        });
      });

      describe('with enough room', function() {
        it('should not have title text', function() {
          var html = '<div expanded="false" multiline-ellipsis max-lines="2000" tolerance="2" text="{{lotsOfText}}" show-more-mode="title-attr">';
          var scope = $rootScope.$new();
          scope.lotsOfText = lotsOfText;
          var el = testHelpers.TestDom.compileAndAppend(html, scope);
          expect(el.text()).to.equal(lotsOfText);
          expect(el.find('.content').attr('title')).to.be.empty;
        });
      });
    });
  });

});
