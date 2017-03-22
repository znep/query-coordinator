import * as dsmapiLinks from 'dsmapiLinks';

describe('dsmapi links', () => {

  it('creates a updateBase link', () => {
    expect(dsmapiLinks.updateBase).to.eq('/api/update/hehe-hehe/0');
  });

  it('creates a uploadIndex link', () => {
    expect(dsmapiLinks.uploadIndex).to.eq('/api/update/hehe-hehe/0/upload');
  });

  it('creates an uploadBytes link', () => {
    expect(dsmapiLinks.uploadBytes(1)).to.eq('/api/update/hehe-hehe/0/upload/1');
  });

  it('creates a newOutputSchema link', () => {
    expect(dsmapiLinks.newOutputSchema(1)).to.eq('/api/update/hehe-hehe/0/schema/1');
  });

  it('creates a transformResults link', () => {
    expect(dsmapiLinks.transformResults(1, 2, 5)).to.eq('/api/update/hehe-hehe/transform/1/results?limit=2&offset=5');
  });
});
