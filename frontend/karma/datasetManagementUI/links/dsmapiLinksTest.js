import { expect, assert } from 'chai';
import * as dsmapiLinks from 'links/dsmapiLinks';

describe('dsmapi links', () => {

  const revisionSeqParams = { revisionSeq: 0 };

  it('creates a revisionBase link', () => {
    expect(dsmapiLinks.revisionBase(revisionSeqParams)).to.eq(
      '/api/publishing/v1/revision/ww72-hpm3/0'
    );
  });

  it('creates a sourceIndex link', () => {
    expect(dsmapiLinks.sourceIndex(revisionSeqParams)).to.eq(
      '/api/publishing/v1/revision/ww72-hpm3/0/source'
    );
  });

  it('creates an sourceBytes link', () => {
    expect(dsmapiLinks.sourceBytes(1)).to.eq('/api/publishing/v1/source/1');
  });

  it('creates a newOutputSchema link', () => {
    expect(dsmapiLinks.newOutputSchema(0, 1)).to.eq(
      '/api/publishing/v1/source/0/schema/1'
    );
  });

  it('creates a transformResults link', () => {
    expect(dsmapiLinks.rows(0, 1, 2, 5, 10)).to.eq(
      '/api/publishing/v1/source/0/schema/1/rows/2?limit=5&offset=10'
    );
  });

});
