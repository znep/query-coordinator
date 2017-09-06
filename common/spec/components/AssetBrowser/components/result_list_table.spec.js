import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import { ResultListTable } from 'common/components/AssetBrowser/components/result_list_table';
import ResultListRow from 'common/components/AssetBrowser/components/result_list_row';
import mockCeteraResults from '../data/mock_cetera_results';
import { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'common/i18n/config/locales/en.yml';

describe('components/ResultListTable', () => {
  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);
  });

  const resultListTableProps = (options = {}) => ({
    changeSortOrder: () => {},
    columns: [
      'type', 'name', 'lastUpdatedDate', 'owner', 'category', 'visibility'
    ],
    results: mockCeteraResults,
    ...options
  });

  it('renders a result-list-table div', () => {
    const element = shallow(
      <ResultListTable {...resultListTableProps()} />
    );
    assert.lengthOf(element.find('.result-list-table'), 1);
  });

  it('renders a table header with the correct column names', () => {
    const props = resultListTableProps({
      columns: ['visibility', 'name', 'type', 'category', 'owner']
    });

    const element = shallow(
      <ResultListTable {...props} />
    );

    const columns = element.find('thead th');

    assert.lengthOf(columns, 5);
    assert.equal(columns.at(0).text(), 'Visibility');
    assert.equal(columns.at(1).text(), 'Name');
    assert.equal(columns.at(2).text(), 'Type');
    assert.equal(columns.at(3).text(), 'Category');
    assert.equal(columns.at(4).text(), 'Owner');
  });

  it('renders a table body with the correct number of rows', () => {
    // Note: there are 6 results in mockCeteraResults
    const element = shallow(
      <ResultListTable {...resultListTableProps()} />
    );
    const rows = element.find(ResultListRow);
    assert.isAtLeast(mockCeteraResults.length, 1);
    assert.lengthOf(rows, mockCeteraResults.length);
  });
});
