import { assert } from 'chai';
import { ResultListTable } from 'components/result_list_table';
import mockCeteraResults from 'data/mock_cetera_results';

describe('components/ResultListTable', () => {
  const resultListTableProps = (options = {}) => ({
    changeSortOrder: () => {},
    columns: [
      'type', 'name', 'lastUpdatedDate', 'owner', 'category', 'visibility'
    ],
    results: mockCeteraResults,
    ...options
  });

  it('renders a result-list-table div', () => {
    const element = renderComponentWithPropsAndStore(ResultListTable, resultListTableProps());
    assert.isNotNull(element);
    assert.match(element.className, /result-list-table/);
  });

  it('renders a table header with the correct column names', () => {
    const element = renderComponentWithPropsAndStore(ResultListTable, resultListTableProps({
      columns: ['visibility', 'name', 'type', 'category', 'owner']
    }));
    const columns = element.querySelectorAll('thead th');

    assert.equal(columns[0].textContent, 'Visibility');
    assert.equal(columns[1].textContent, 'Name');
    assert.equal(columns[2].textContent, 'Type');
    assert.equal(columns[3].textContent, 'Category');
    assert.equal(columns[4].textContent, 'Owner');
    assert.isUndefined(columns[5]);
  });

  it('renders a table body with the correct number of rows', () => {
    // Note: there are 6 results in mockCeteraResults
    const element = renderComponentWithPropsAndStore(ResultListTable, resultListTableProps());
    const rows = element.querySelectorAll('tr.result-list-row');
    assert.lengthOf(rows, 6);
  });
});