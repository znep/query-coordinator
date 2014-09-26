describe("multilineEllipsis directive", function(FlyoutService) {
  var $rootScope;
  var testHelpers;
  var lotsOfText = _.times(100, function() {
    return "This is a test of the emergency broadcast system. This is only a test. ";
  }).join('');
  var mockFlyoutService = {
    register: function() {}
  };


  beforeEach(module('test'));

  beforeEach(module('dataCards'));

  // Overriding providers must occur _after_ the dataCards module has been loaded because load order...
  beforeEach(function() {
    module(function($provide) {
      $provide.value('FlyoutService', mockFlyoutService);
    });
  });

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
        var html = '<div expanded="false" multiline-ellipsis max-lines="2" tolerance="2" text="{{lotsOfText}}" animation-duration="0">';

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
        var html = '<div expanded="false" multiline-ellipsis max-lines="2000" tolerance="2" text="{{lotsOfText}}" animation-duration="0">';

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
          var html = '<div expanded="false" multiline-ellipsis max-lines="2" tolerance="2" text="{{lotsOfText}}" show-more-mode="title-attr" animation-duration="0">';
          var scope = $rootScope.$new();
          scope.lotsOfText = lotsOfText;
          var el = testHelpers.TestDom.compileAndAppend(html, scope);
          expect(el.text()).to.contain('...');
          expect(el.find('.content').attr('title')).to.equal(lotsOfText);
        });
      });

      describe('with enough room', function() {
        it('should not have title text', function() {
          var html = '<div expanded="false" multiline-ellipsis max-lines="2000" tolerance="2" text="{{lotsOfText}}" show-more-mode="title-attr" animation-duration="0">';
          var scope = $rootScope.$new();
          scope.lotsOfText = lotsOfText;
          var el = testHelpers.TestDom.compileAndAppend(html, scope);
          expect(el.text()).to.equal(lotsOfText);
          expect(el.find('.content').attr('title')).to.be.empty;
        });
      });

    });

    describe('with show-more-mode as flyout', function() {
      it('should register a flyout and add a custom classname when show-more-mode is flyout', function(done) {
        try {
          var html = '<div expanded="false" multiline-ellipsis max-lines="1" tolerance="1" text="{{lotsOfText}}" show-more-mode="flyout" animation-duration="0">';
          var scope = $rootScope.$new();
          scope.lotsOfText = lotsOfText;

          var registrationSpy = sinon.spy(mockFlyoutService, 'register');
          var element = testHelpers.TestDom.compileAndAppend(html, scope);
          var content = element.find('.content');

          expect(content.text()).to.contain('...');
          expect(content.attr('title')).to.be.empty;
          expect(registrationSpy.calledOnce, 'FlyoutService.register never called').to.be.true;
          expect(registrationSpy.getCall(0).args[0]).to.match(/multiline-ellipsis-flyout-\d?/);
          mockFlyoutService.register.restore();
          done();
        } catch (err) {
          console.log("Exception raised: ", err);
          throw(err);
        }
      });
    });

    describe('with show-more-mode as none', function() {
      it('should not register a flyout of set the title when show-more-mode is none', function(done) {
        try {
          var html = '<div expanded="false" multiline-ellipsis max-lines="1" tolerance="1" text="{{lotsOfText}}" show-more-mode="none" animation-duration="0">';
          var scope = $rootScope.$new();
          scope.lotsOfText = lotsOfText;

          var registrationSpy = sinon.spy(mockFlyoutService, 'register');
          var element = testHelpers.TestDom.compileAndAppend(html, scope);
          var content = element.find('.content');

          expect(content.text()).to.contain('...');
          expect(content.attr('title')).to.be.empty;
          expect(registrationSpy.called, 'FlyoutService.register never called').to.be.false;
          mockFlyoutService.register.restore();
          done();
        } catch (err) {
          console.log("Exception raised: ", err);
          throw(err);
        }
      });
    });

  });

});
