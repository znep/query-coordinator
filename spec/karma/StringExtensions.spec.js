describe('String.prototype.format', function() {
  'use strict';

  it('should insert correctly via index', function() {
    assert.equal(
      '{0}, {1}, {2}, {3}, {4}'.format(1, '2', 3, 4, 'five'),
      '1, 2, 3, 4, five'
    );
  });
});
