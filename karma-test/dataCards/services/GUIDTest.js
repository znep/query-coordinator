describe('Pseudo-GUID service', function() {
  var guid;

  beforeEach(module('socrataCommon.services'));

  beforeEach(inject(function($injector) {
    var $window = $injector.get('$window');
    $window.navigator = {
      mimeTypes: [],
      userAgent: '',
      plugins: ['']
    };
    $window.screen = {
      height: 2,
      width: 3,
      pixelDepth: 4
    };
    guid = $injector.get('guid');
  }));


  it('should return a GUID based off elements of the navigator and screen', function() {
    expect(guid).to.equal('01234');
  });

});
