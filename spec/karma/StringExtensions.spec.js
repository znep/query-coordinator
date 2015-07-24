describe('String.prototype.format', function() {
  'use strict';

  it('should insert correctly via index', function() {
    expect('{0}, {1}, {2}, {3}, {4}'.format(1, '2', 3, 4, 'five')).to.equal('1, 2, 3, 4, five');
  });
});
