import purify from 'common/purify';

describe('purify', () => {
  it('strips evil html', () => {
    expect(purify('<script>alert();</script>hi')).to.equal('hi');
  });

  it('keeps nice html', () => {
    expect(purify('<iframe></iframe><em>pathy</em>')).to.equal('<em>pathy</em>');
  });
});
