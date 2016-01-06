describe('Domain model', function() {
  'use strict';

  var Domain;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    Domain = $injector.get('Domain');
  }));

  it('should contain an array of officially supported categories if available', function() {
    var domain;
    var domainMetadata;

    domainMetadata = { categories: ['Business', 'Education', 'Community'] };
    domain = new Domain(domainMetadata);
    expect(domain.categories).to.eql(domainMetadata.categories);

    domainMetadata = {};
    domain = new Domain(domainMetadata);
    expect(domain.categories).to.eql([]);
  });

});
