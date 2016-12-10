import * as dsmapiLinks from 'dsmapiLinks';

describe('dsmapi links', () => {

  // comes from react state
  const mockWrappedRouting = {
    locationBeforeTransitions: {
      pathname: '/dataset/Herp-Derp-27/p4k7-ka86/updates/0/uploads'
    }
  }

  //come from calling Link_to and passing in a function
  const mockRouting = {
    pathname: '/dataset/Herp-Derp-27/p4k7-ka86/updates/0/uploads'
  }

  it('creates a home link', () => {
    expect(dsmapiLinks.home(mockWrappedRouting)).to.eq('/api/update/p4k7-ka86/0');
    expect(dsmapiLinks.home(mockRouting)).to.eq('/api/update/p4k7-ka86/0');
  });

  it('creates a uploadIndex link', () => {
    expect(dsmapiLinks.uploadIndex(mockWrappedRouting)).to.eq('/api/update/p4k7-ka86/0/upload');
    expect(dsmapiLinks.uploadIndex(mockRouting)).to.eq('/api/update/p4k7-ka86/0/upload');
  })

  it('creates an uploadBytes link', () => {
    expect(dsmapiLinks.uploadBytes(mockWrappedRouting, 1)).to.eq('/api/update/p4k7-ka86/0/upload/1');
    expect(dsmapiLinks.uploadBytes(mockRouting, 1)).to.eq('/api/update/p4k7-ka86/0/upload/1');
  })

  it('creates a transformResults link', () => {
    expect(dsmapiLinks.transformResults(mockWrappedRouting, 1, 2, 5)).to.eq('/api/update/p4k7-ka86/transform/1/results?limit=2&offset=5');
    expect(dsmapiLinks.transformResults(mockRouting, 1, 2, 5)).to.eq('/api/update/p4k7-ka86/transform/1/results?limit=2&offset=5');
  })
});
