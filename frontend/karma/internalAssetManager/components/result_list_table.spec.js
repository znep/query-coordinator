import { assert } from 'chai';
import { mount } from 'enzyme';
import I18nJS from 'i18n-js';

import { ResultListTable } from 'components/result_list_table';
import mockCeteraResults from 'data/mock_cetera_results';

describe('components/ResultListTable', () => {
  const resultListTableProps = (options = {}) => ({
    changeSortOrder: () => {},
    columns: [
      'type', 'name', 'lastUpdatedDate', 'owner', 'category', 'visibility'
    ],
    I18n: I18nJS,
    results: mockCeteraResults,
    ...options
  });

  it('renders a result-list-table div', () => {
    const element = mount(renderLocalizedComponentWithPropsAndStore(ResultListTable, resultListTableProps()));
    assert.isNotNull(element);
    assert.match(element.find('.result-list-table').node.className, /result-list-table/);
  });

  it('renders a table header with the correct column names', () => {
    const element = mount(renderLocalizedComponentWithPropsAndStore(ResultListTable, resultListTableProps({
      columns: ['visibility', 'name', 'type', 'category', 'owner']
    })));
    const columns = element.find('thead th').nodes;

    assert.equal(columns[0].textContent, 'Visibility');
    assert.equal(columns[1].textContent, 'Name');
    assert.equal(columns[2].textContent, 'Type');
    assert.equal(columns[3].textContent, 'Category');
    assert.equal(columns[4].textContent, 'Owner');
    assert.isUndefined(columns[5]);
  });

  it('renders a table body with the correct number of rows', () => {
    // Note: there are 6 results in mockCeteraResults
    const element = mount(renderLocalizedComponentWithPropsAndStore(ResultListTable, resultListTableProps()));
    const rows = element.find('tr.result-list-row');
    assert.lengthOf(rows, 6);
  });
});
