describe('pluralize', function() {
  'use strict';

  it('should exist', function() {
    expect('foo').to.respondTo('pluralize');
  });

  it('should trim whitespace', function() {
    expect('foo '.pluralize()).to.equal('foos');
  });

  it('should pluralize octopus', function() {
    expect('octopus'.pluralize()).to.equal('octopi');
  });

});
