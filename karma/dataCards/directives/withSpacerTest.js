describe('withSpacer directive', function() {
  'use strict';

  var testHelpers;
  var $rootScope;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    $rootScope = $injector.get('$rootScope');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  it('should add an element with the same dimensions to the same parent', function() {
    var scope = $rootScope.$new();
    // Create an element with some styles that should be copied, some that shouldn't
    var styles = {
      width: '11px',
      height: '12px',
      padding: '13px',
      margin: '14px',
      'line-height': '1em',
      position: 'absolute',
      // Add a non-relevant property
      color: 'blue'
    };
    var el = testHelpers.TestDom.compileAndAppend(
      // Create the markup, and apply the styles
      '<div with-spacer style="{0};"></div>'.format(
        _.map(styles, function(v, k) { return k + ':' + v; }).join(';')
    ), scope);
    expect(el.width()).to.equal(11);
    expect(el.height()).to.equal(12);

    // make sure a spacer element is there, with the relevant copied properties
    var spacer = el.siblings('.spacer');
    expect(spacer.length).to.equal(1);

    expect(spacer.width()).to.equal(el.width());
    expect(spacer.height()).to.equal(el.height());

    expect(spacer.css('position')).to.equal('relative');
    expect(spacer.css('position')).not.to.equal(el.css('position'));
    // Make sure the non-relevant property isn't copied over
    expect(spacer.css('color')).not.to.equal(el.css('color'));
  });

  it('should auto-change the spacer\'s dimensions to match the element\'s', function(done) {
    var scope = $rootScope.$new();
    var el = testHelpers.TestDom.compileAndAppend('<div with-spacer></div>', scope);

    // make sure a spacer element is there, with the relevant copied properties
    var spacer = el.siblings('.spacer');
    expect(spacer.length).to.equal(1);

    expect(spacer.width()).to.equal(el.width());
    expect(spacer.height()).to.equal(el.height());

    el.width(123);
    el.height(897);

    // Let the dimensions plugin notice that the dimension changed
    testHelpers.waitForSatisfy(function() {
      return spacer.width() === el.width() &&
        spacer.height() === el.height();
    }).then(done);
  });

  it('should clean up after itself when the scope is destroyed', function() {
    var scope = $rootScope.$new();
    var el = testHelpers.TestDom.compileAndAppend('<div with-spacer></div>', scope);

    expect(el.siblings('.spacer').length).to.equal(1);
    expect(el.observeDimensions().observers.length).to.be.equal(1);

    scope.$emit('$destroy');

    expect(el.siblings('.spacer').length).to.equal(0);
    expect(el.observeDimensions().observers.length).to.be.equal(0);
  });
});
