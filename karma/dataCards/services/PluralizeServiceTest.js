describe('pluralize', function() {
  'use strict';

  var PluralizeService;

  beforeEach(module('socrataCommon.services'));
  beforeEach(inject(function($injector) {
    PluralizeService = $injector.get('PluralizeService');
  }));

  it('should trim whitespace', function() {
    expect(PluralizeService.pluralize('foo ')).to.equal('foos');
  });

  it('should pluralize octopus', function() {
    expect(PluralizeService.pluralize('octopus')).to.equal('octopi');
  });

  it('should not pluralize money', function() {
    expect(PluralizeService.pluralize('money')).to.equal('money');
  });

  it('should not pluralize money if it has other words before it', function() {
    expect(PluralizeService.pluralize('cash money')).to.equal('cash money');
  });

  it('should not modify the string if the second parameter is 1', function() {
    expect(PluralizeService.pluralize('cat')).to.equal('cats');
    expect(PluralizeService.pluralize('cat', 0)).to.equal('cats');
    expect(PluralizeService.pluralize('cat', 1)).to.equal('cat');
    expect(PluralizeService.pluralize('cat', 2)).to.equal('cats');
    expect(_.partial(PluralizeService.pluralize, 'cat', '1')).to.throw();
    expect(_.partial(PluralizeService.pluralize, 'cat', null)).to.throw();
    expect(_.partial(PluralizeService.pluralize, 'cat', 'dog')).to.throw();
  });
});
