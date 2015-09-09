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

  it('should not pluralize money', function() {
    expect('money'.pluralize()).to.equal('money');
  });

  it('should not pluralize money if it has other words before it', function() {
    expect('cash money'.pluralize()).to.equal('cash money');
  });

});
