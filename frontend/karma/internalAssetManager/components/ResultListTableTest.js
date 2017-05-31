import { assert } from 'chai';
import { ResultListTable } from 'components/ResultListTable';
import mockCeteraResults from 'data/mockCeteraResults';

describe('components/ResultListTable', () => {
  const resultListTableProps = (options = {}) => ({
    changeOrder: () => {},
    columns: [
      'type', 'name', 'lastUpdatedDate', 'owner', 'category', 'visibility'
    ],
    results: mockCeteraResults,
    ...options
  });

  it('renders a result-list-table div', () => {
    const element = renderComponentWithStore(ResultListTable, resultListTableProps());
    assert.isNotNull(element);
    assert.match(element.className, /result-list-table/);
  });

  it('renders a table header with the correct column names', () => {
    const element = renderComponentWithStore(ResultListTable, resultListTableProps({
      columns: ['visibility', 'name', 'type', 'category']
    }));
    const columns = element.querySelectorAll('thead th');

    assert.equal(columns[0].textContent, 'Visibility');
    assert.equal(columns[1].textContent, 'Name');
    assert.equal(columns[2].textContent, 'Type');
    assert.equal(columns[3].textContent, 'Category');
    assert.isUndefined(columns[4]);
  });

  it('renders a table body with the correct number of rows', () => {
    // Note: there are 6 results in mockCeteraResults
    const element = renderComponentWithStore(ResultListTable, resultListTableProps());
    const rows = element.querySelectorAll('tr.result-list-row');
    assert.lengthOf(rows, 6);
  });
});
