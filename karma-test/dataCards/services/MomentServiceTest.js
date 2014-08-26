describe('Moment service', function() {
  var moment;
  var mockWindow = {
    moment: function() { }
  };

  beforeEach(function() {
    module('socrataCommon.services', function($provide) {
      $provide.value('$window', mockWindow);
    });
  });

  beforeEach(inject(function($injector) {
    moment = $injector.get('moment');
  }));


  it('should provide the "moment" object on the window', function() {
    expect(moment).to.be.a('function');
    expect(moment).to.equal(mockWindow.moment);
  });

});
