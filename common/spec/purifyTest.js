import purify from 'common/purify';

describe('purify', () => {
  it('strips evil html', () => {
    assert.equal(purify('<script>alert();</script>hi'), 'hi');
  });

  it('keeps nice html', () => {
    assert.equal(purify('<iframe></iframe><em>pathy</em>'), '<em>pathy</em>');
  });
});
