import { expect, assert } from 'chai';
import { ResultListRow } from 'components/ResultListRow';

describe('components/ResultListRow', () => {
  const resultListRowProps = (options = {}) => ({
    category: 'Fun',
    columns: ['type', 'name', 'lastUpdatedDate', 'owner', 'category', 'visibility'],
    description: 'The fifth sense: The sense of smell. The ability to smell crime before it even happens.',
    isPublic: true,
    isPublished: true,
    link: 'https://data.seattle.gov/dataset/blah-blah/cfa5-i2ky',
    name: 'Haley Joel Osment',
    type: 'datalens',
    uid: 'abcd-1234',
    updatedAt: '2017-04-21T18:31:29.000Z',
    visibleToAnonymous: true,
    ...options
  });

  it('renders a table row', () => {
    const element = renderComponentWithStore(ResultListRow, resultListRowProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'result-list-row');
  });

  it('renders cells in the order specified by the "columns" prop', () => {
    const element = renderComponentWithStore(ResultListRow, resultListRowProps({
      columns: ['visibility', 'name', 'type', 'category']
    }));
    const cells = element.querySelectorAll('td');
    assert.lengthOf(cells, 4);
    assert.equal(cells[3].textContent, 'Fun');
  });

  it('renders a span with the correct icon class for the "type" cell', () => {
    const element = renderComponentWithStore(ResultListRow, resultListRowProps({
      columns: ['type'],
      type: 'dataset'
    }));
    assert.equal(element.querySelector('td span').className, 'socrata-icon-dataset');
  });

  it('renders a div with a "name" and "description" for the "name" cell', () => {
    const element = renderComponentWithStore(ResultListRow, resultListRowProps({
      columns: ['name']
    }));
    const nameCell = element.querySelector('td')
    assert.isNotNull(nameCell.querySelector('a'));
    assert.equal(nameCell.querySelector('a').getAttribute('href'), 'https://data.seattle.gov/dataset/blah-blah/cfa5-i2ky');
    assert.equal(nameCell.querySelector('a span.name').textContent, 'Haley Joel Osment');
    assert.equal(nameCell.querySelector('span.description').textContent,
      'The fifth sense: The sense of smell. The ability to smell crime before it even happens.');
  });
});
