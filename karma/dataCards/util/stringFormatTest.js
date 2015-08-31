describe('String.prototype.format', function() {
  'use strict';

  it('should replace numeric tokens when string arguments are given', function() {
    expect('test {0} test'.format('TEST')).to.equal('test TEST test');
    expect('{0} TEST {1}'.format('one', 'two')).to.equal('one TEST two');
  });

  it('should not replace non-numeric token-like entities if string arguments are given', function() {
    expect('{x}-{y}-{z}-{0}-{1}'.format('one', 'two')).to.equal('{x}-{y}-{z}-one-two');
    expect('{x}'.format('one')).to.equal('{x}');
  });

});
