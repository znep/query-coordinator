import { assert } from 'chai';
import * as Links from 'links';

describe('Links', () => {
  const params = {
    category: 'dataset',
    name: 'mm',
    fourfour: 'kp42-jdvd',
    revisionSeq: '0'
  };

  const expectedBase = '/dataset/mm/kp42-jdvd/manage';
  const revisionBase = `${expectedBase}/revisions/0`;

  it('creates a home link', () => {
    const link = Links.home(params);

    assert.equal(link, expectedBase);
  });

  it('creates a revisionBase link', () => {
    const link = Links.revisionBase(params);

    assert.equal(link, revisionBase);
  });

  it('creates a manageTab link', () => {
    const link = Links.manageTab(params);

    assert.equal(link, `${revisionBase}/manageTab`);
  });

  it('creates a metadata link', () => {
    const link = Links.metadata(params);

    assert.equal(link, `${revisionBase}/metadata`);
  });

  it('creates an edit dataset metadata link', () => {
    const link = Links.datasetMetadataForm(params);

    assert.equal(link, `${revisionBase}/metadata/dataset`);
  });

  it('creates an edit column metadata link', () => {
    const link = Links.columnMetadataForm(params, 200);

    assert.equal(link, `${revisionBase}/metadata/200/columns`);
  });

  it('creates an edit column metadata link with a column id', () => {
    const link = Links.columnMetadataForm(params, 200, 2758);

    assert.equal(link, `${revisionBase}/metadata/200/columns#2758`);
  });

  it('creates a sources link', () => {
    const link = Links.sources(params);

    assert.equal(link, `${revisionBase}/sources`);
  });

  it('creates a showOuptutSchema link', () => {
    const link = Links.showOutputSchema(params, 81, 200, 888, 4);

    assert.equal(
      link,
      `${revisionBase}/sources/81/schemas/200/output/888/page/4`
    );
  });

  it('creates a showColumnErrors link', () => {
    const link = Links.showColumnErrors(params, 81, 200, 888, 99, 4);

    assert.equal(
      link,
      `${revisionBase}/sources/81/schemas/200/output/888/column_errors/99/page/4`
    );
  });

  it('creates a showRowErrors link', () => {
    const link = Links.showRowErrors(params, 81, 200, 888, 2);

    assert.equal(
      link,
      `${revisionBase}/sources/81/schemas/200/output/888/row_errors/page/2`
    );
  });
});
