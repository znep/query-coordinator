import { expect, assert } from 'chai';
import * as dsmapiLinks from 'dsmapiLinks';

describe('dsmapi links', () => {

  it('creates a revisionBase link', () => {
    expect(dsmapiLinks.revisionBase).to.eq('/api/publishing/v1/revision/hehe-hehe/0');
  });

  it('creates a uploadIndex link', () => {
    expect(dsmapiLinks.uploadIndex).to.eq('/api/publishing/v1/revision/hehe-hehe/0/upload');
  });

  it('creates an uploadBytes link', () => {
    expect(dsmapiLinks.uploadBytes(1)).to.eq('/api/publishing/v1/upload/1');
  });

  it('creates a newOutputSchema link', () => {
    expect(dsmapiLinks.newOutputSchema(0, 1)).to.eq('/api/publishing/v1/upload/0/schema/1');
  });

  it('creates a transformResults link', () => {
    expect(dsmapiLinks.transformResults(0, 1, 2, 5)).to.eq('/api/publishing/v1/upload/0/transform/1/results?limit=2&offset=5');
  });
});
