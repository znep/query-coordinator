import { assert } from 'chai';
import { ResultListRow } from 'components/result_list_row';

describe('components/ResultListRow', () => {
  const resultListRowProps = (options = {}) => ({
    category: 'Fun',
    columns: ['type', 'name', 'lastUpdatedDate', 'owner', 'category', 'visibility'],
    description: 'The fifth sense: The sense of smell. The ability to smell crime before it even happens.',
    isPublic: true,
    isPublished: true,
    link: 'https://data.seattle.gov/dataset/blah-blah/cfa5-i2ky',
    name: 'Haley Joel Osment',
    ownerName: 'Billy Bob',
    type: 'datalens',
    uid: 'abcd-1234',
    updatedAt: '2017-04-21T18:31:29.000Z',
    visibleToAnonymous: true,
    ...options
  });

  const elementWithType = (type) => {
    return renderComponentWithPropsAndStore(ResultListRow, resultListRowProps({ columns: ['type'], type }));
  };

  it('renders a table row', () => {
    const element = renderComponentWithPropsAndStore(ResultListRow, resultListRowProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'result-list-row');
  });

  it('renders cells in the order specified by the "columns" prop', () => {
    const element = renderComponentWithPropsAndStore(ResultListRow, resultListRowProps({
      columns: ['visibility', 'name', 'type', 'category', 'owner']
    }));
    const cells = element.querySelectorAll('td');
    assert.lengthOf(cells, 5);
    assert.equal(cells[3].textContent, 'Fun');
  });

  describe('renders a span with the correct icon class for the "type" cell', () => {
    it('renders the correct icon for type "dataset", "table", or "federated"', () => {
      assert.include(elementWithType('dataset').querySelector('td span').className, 'socrata-icon-dataset');
      assert.include(elementWithType('federated').querySelector('td span').className, 'socrata-icon-dataset');
      assert.include(elementWithType('table').querySelector('td span').className, 'socrata-icon-dataset');
    });
    it('renders the correct icon for type "filter" or "grouped"', () => {
      assert.include(elementWithType('filter').querySelector('td span').className, 'socrata-icon-filter');
      assert.include(elementWithType('grouped').querySelector('td span').className, 'socrata-icon-filter');
    });
    it('renders the correct icon for type "href"', () => {
      assert.include(elementWithType('href').querySelector('td span').className, 'socrata-icon-external');
    });
    it('renders the correct icon for "datalens", or "visualization" types', () => {
      assert.include(elementWithType('data_lens').querySelector('td span').className, 'socrata-icon-cards');
      assert.include(elementWithType('datalens').querySelector('td span').className, 'socrata-icon-cards');
      assert.include(elementWithType('visualization').querySelector('td span').className, 'socrata-icon-cards');
    });
    it('renders the correct icon for type "story"', () => {
      assert.include(elementWithType('story').querySelector('td span').className, 'socrata-icon-story');
    });
    it('renders the correct icon for "map" types', () => {
      assert.include(elementWithType('data_lens_map').querySelector('td span').className, 'socrata-icon-map');
      assert.include(elementWithType('geomap').querySelector('td span').className, 'socrata-icon-map');
      assert.include(elementWithType('intensitymap').querySelector('td span').className, 'socrata-icon-map');
      assert.include(elementWithType('map').querySelector('td span').className, 'socrata-icon-map');
    });
    it('renders the correct icon for "chart" types', () => {
      assert.include(
        elementWithType('annotatedtimeline').querySelector('td span').className, 'socrata-icon-bar-chart'
      );
      assert.include(elementWithType('areachart').querySelector('td span').className, 'socrata-icon-bar-chart');
      assert.include(elementWithType('barchart').querySelector('td span').className, 'socrata-icon-bar-chart');
      assert.include(elementWithType('chart').querySelector('td span').className, 'socrata-icon-bar-chart');
      assert.include(
        elementWithType('columnchart').querySelector('td span').className, 'socrata-icon-bar-chart'
      );
      assert.include(
        elementWithType('data_lens_chart').querySelector('td span').className, 'socrata-icon-bar-chart'
      );
      assert.include(
        elementWithType('imagesparkline').querySelector('td span').className, 'socrata-icon-bar-chart'
      );
      assert.include(elementWithType('linechart').querySelector('td span').className, 'socrata-icon-bar-chart');
      assert.include(elementWithType('piechart').querySelector('td span').className, 'socrata-icon-bar-chart');
    });
    it('renders the correct icon for type "calendar"', () => {
      assert.include(elementWithType('calendar').querySelector('td span').className, 'socrata-icon-date');
    });
    it('renders the correct icon for type "form"', () => {
      assert.include(elementWithType('form').querySelector('td span').className, 'socrata-icon-list2');
    });
    it('renders the correct icon for type "file", or "blob"', () => {
      assert.include(elementWithType('blob').querySelector('td span').className, 'socrata-icon-attachment');
      assert.include(elementWithType('file').querySelector('td span').className, 'socrata-icon-attachment');
    });
    it('renders a generic data icon for unknown types', () => {
      assert.include(elementWithType('unknown').querySelector('td span').className, 'socrata-icon-data');
    });
  });

  describe('renders a span with the correct title for the asset type', () => {
    it('renders the correct title for type "blob", or "file"', () => {
      assert.equal(elementWithType('blob').querySelector('td span').getAttribute('title'), 'File or Document');
      assert.equal(elementWithType('file').querySelector('td span').getAttribute('title'), 'File or Document');
    });
    it('renders the correct title for type "calendar"', () => {
      assert.equal(elementWithType('calendar').querySelector('td span').getAttribute('title'), 'Calendar');
    });
    it('renders the correct title for type "datalens", or "new_view"', () => {
      assert.equal(elementWithType('datalens').querySelector('td span').getAttribute('title'), 'Data Lens');
      assert.equal(elementWithType('new_view').querySelector('td span').getAttribute('title'), 'Data Lens');
    });
    it('renders the correct title for type "dataset"', () => {
      assert.equal(elementWithType('dataset').querySelector('td span').getAttribute('title'), 'Dataset');
    });
    it('renders the correct title for type "draft"', () => {
      assert.equal(elementWithType('draft').querySelector('td span').getAttribute('title'), 'Draft Dataset');
    });
    it('renders the correct title for type "filter"', () => {
      assert.equal(elementWithType('filter').querySelector('td span').getAttribute('title'), 'Filtered View');
    });
    it('renders the correct title for type "form"', () => {
      assert.equal(elementWithType('form').querySelector('td span').getAttribute('title'), 'Form');
    });
    it('renders the correct title for type "href"', () => {
      assert.equal(
        elementWithType('href').querySelector('td span').getAttribute('title'), 'External Dataset'
      );
    });
    it('renders the correct title for type "map"', () => {
      assert.equal(elementWithType('map').querySelector('td span').getAttribute('title'), 'Map');
    });
    it('renders the correct title for type "pulse"', () => {
      assert.equal(elementWithType('pulse').querySelector('td span').getAttribute('title'), 'Pulse');
    });
    it('renders the correct title for type "story"', () => {
      assert.equal(elementWithType('story').querySelector('td span').getAttribute('title'), 'Story');
    });
  });

  it('renders a div with a "name" and "description" for the "name" cell', () => {
    const element = renderComponentWithPropsAndStore(ResultListRow, resultListRowProps({
      columns: ['name']
    }));
    const nameCell = element.querySelector('td')
    assert.isNotNull(nameCell.querySelector('a'));
    assert.equal(
      nameCell.querySelector('a').getAttribute('href'), 'https://data.seattle.gov/dataset/blah-blah/cfa5-i2ky'
    );
    assert.equal(nameCell.querySelector('a span.name').textContent, 'Haley Joel Osment');
    assert.equal(nameCell.querySelector('span.description').textContent,
      'The fifth sense: The sense of smell. The ability to smell crime before it even happens.');
  });
});
