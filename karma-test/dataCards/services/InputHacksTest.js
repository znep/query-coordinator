describe('InputHacks', function() {
  var testHelpers;
  var InputHacks;

  beforeEach(module('dataCards'));

  beforeEach(inject(function($injector) {
    InputHacks = $injector.get('InputHacks');
    testHelpers = $injector.get('testHelpers');
  }));

  var testDivWidth = 20;
  var testDivHeight = 15;
  var testDivTop = 30;
  var testDivLeft = 10;

  function makeTestDiv() {
    var div = $('<div style="position: fixed; top: {0}px; left: {1}px; width: {2}px; height: {3}px"></div>'.format(
        testDivTop,
        testDivLeft,
        testDivWidth,
        testDivHeight
        )
      );
    testHelpers.TestDom.append(div);
    return div;
  }

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  describe('captureAllMouseEventsOutsideOf', function() {
    it('should throw on invalid input', function() {
      expect(function() { InputHacks.captureAllMouseEventsOutsideOf(); }).to.throw();
      expect(function() { InputHacks.captureAllMouseEventsOutsideOf(null); }).to.throw();
      expect(function() { InputHacks.captureAllMouseEventsOutsideOf({}); }).to.throw();
    });

    it('should only set up the capture upon subscription, and tear down on unsubscription', function() {
      var div = makeTestDiv();
      function hitTest() {
        return document.elementFromPoint(testDivLeft - 5, testDivTop - 5);
      };

      // Grab the element just outside the test div.
      var elementOutsideDiv = hitTest();
      
      var seq = InputHacks.captureAllMouseEventsOutsideOf(div);

      expect(hitTest()).to.equal(elementOutsideDiv); // expect no change just from creating the sequence.
      
      var subscription = seq.subscribe(function(){}); // This should set up the overlays.

      expect(hitTest()).to.not.equal(elementOutsideDiv); // Now expect to hit the overlays.

      subscription.dispose();

      expect(hitTest()).to.equal(elementOutsideDiv); // Should no longer hit the overlays.

    });

    it('should only set up one shared set of capture overlays, and dispose only when all subscriptions are disposed', function() {
      var div = makeTestDiv();
      function hitTest() {
        return document.elementFromPoint(testDivLeft - 5, testDivTop - 5);
      };

      // Grab the element just outside the test div.
      var elementOutsideDiv = hitTest();
      
      var seq = InputHacks.captureAllMouseEventsOutsideOf(div);
      var subscription1 = seq.subscribe(function(){}); // This should set up the overlays.

      var captureElement = hitTest();

      var subscription2 = seq.subscribe(function(){}); // This should keep using the same overlays.
      expect(hitTest()).to.equal(captureElement).and.not.equal(elementOutsideDiv);

      subscription1.dispose();

      expect(hitTest()).to.equal(captureElement);

      subscription2.dispose();
      expect(hitTest()).to.equal(elementOutsideDiv);
    });

    it('should terminate the sequence and clean up if the original element is removed', function(done) {
      var div = makeTestDiv();
      function hitTest() {
        return document.elementFromPoint(testDivLeft - 5, testDivTop - 5);
      };

      var seq = InputHacks.captureAllMouseEventsOutsideOf(div);

      var subscription = seq.subscribe(function(){}, undefined, function() {
        done();
      });

      div.remove();

      // See comment in InputHacks' elementInDom. Ideally we'd react to browser events, but that's hard.
      // The implementation thus only checks for removal on mouse events.
      $(hitTest()).click();
    });

    it('should surface mouse events from the overlays only, and not the actual element', function(done) {
      var div = makeTestDiv();
      function hitTest(xOffset, yOffset) {
        return document.elementFromPoint(testDivLeft + xOffset, testDivTop + yOffset);
      };

      var seq = InputHacks.captureAllMouseEventsOutsideOf(div);
      seq.take(4).pluck('target').toArray().subscribe(function(targets) {
        expect(targets).to.not.contain(div);
        done();
      });

      div.click();
      $(hitTest(-5, 0)).click(); // Left
      $(hitTest(testDivWidth + 5, 0)).click(); // Right
      $(hitTest(testDivWidth / 2, -5)).click(); // Top
      $(hitTest(testDivWidth / 2, testDivHeight + 5)).click(); // Bottom

    });

    it('should correctly tag mouse events according to corner', function(done) {
      var div = makeTestDiv();
      function hitTest(xOffset, yOffset) {
        return document.elementFromPoint(testDivLeft + xOffset, testDivTop + yOffset);
      };

      var seq = InputHacks.captureAllMouseEventsOutsideOf(div);
      seq.take(4).pluck('externalCorner').toArray().subscribe(function(corners) {
        expect(corners).to.deep.equal([
          'bottom', 'left', 'right', 'top'
        ]);
        done();
      });

      $(hitTest(testDivWidth / 2, testDivHeight + 5)).click(); // Bottom
      $(hitTest(-5, 0)).click(); // Left
      $(hitTest(testDivWidth + 5, 0)).click(); // Right
      $(hitTest(testDivWidth / 2, -5)).click(); // Top
    });
  });

});
