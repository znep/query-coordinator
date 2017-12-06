import { shallow } from 'enzyme';
import React from 'react';
import ReactDOM from 'react-dom';

import { assert } from 'chai';
import AssetTypeIcon from 'common/components/AssetTypeIcon';
import { ResultListRow } from 'common/components/AssetBrowser/components/result_list_row';
import { FeatureFlags } from 'common/feature_flags';

describe('components/ResultListRow', () => {

  beforeEach(() => FeatureFlags.updateTestFixture({ usaid_features_enabled: false, disable_authority_badge: false }));

  const resultListRowProps = (options = {}) => ({
    activeTab: 'stub active tab',
    category: 'Fun',
    columns: ['type', 'name', 'lastUpdatedDate', 'owner', 'category', 'visibility'],
    description: 'The fifth sense: The sense of smell. The ability to smell crime before it even happens.',
    isOwner: false,
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
    return shallow(<ResultListRow {...resultListRowProps({ columns: ['type'], type })} />);
  };

  it('renders a table row', () => {
    const element = shallow(<ResultListRow {...resultListRowProps()} />);
    assert.isNotNull(element);
    assert.equal(element.prop('className'), 'result-list-row');
  });

  it('renders cells in the order specified by the "columns" prop', () => {
    const props = resultListRowProps({
      columns: ['visibility', 'name', 'type', 'category', 'owner']
    });
    const element = shallow(<ResultListRow {...props} />);

    const cells = element.find('td');
    assert.lengthOf(cells, 5);
    assert.equal(cells.at(3).text(), 'Fun');
  });

  describe('with usaid features disabled', () => {
    it('displays the icon for the asset type', () => {
      assert.equal(elementWithType('href').find(AssetTypeIcon).prop('displayType'), 'href');
      assert.equal(elementWithType('dataset').find(AssetTypeIcon).prop('displayType'), 'dataset');
    });
  });

  describe('with usaid features enabled', () => {
    beforeEach(() => FeatureFlags.updateTestFixture({ usaid_features_enabled: true }));
    it('overrides the href icon', () => {
      assert.equal(elementWithType('href').find(AssetTypeIcon).prop('displayType'), 'data_asset');
    });
    it('displays the default icon for other types', () => {
      assert.equal(elementWithType('dataset').find(AssetTypeIcon).prop('displayType'), 'dataset');
    });
  });

  describe('renders a span with the correct tooltip for the asset type', () => {
    it('renders the correct tooltip for type "blob", or "file"', () => {
      assert.equal(elementWithType('blob').find(AssetTypeIcon).prop('tooltip'), 'File or Document');
      assert.equal(elementWithType('file').find(AssetTypeIcon).prop('tooltip'), 'File or Document');
    });
    it('renders the correct tooltip for type "calendar"', () => {
      assert.equal(elementWithType('calendar').find(AssetTypeIcon).prop('tooltip'), 'Calendar');
    });
    it('renders the correct tooltip for type "datalens", or "new_view"', () => {
      assert.equal(elementWithType('datalens').find(AssetTypeIcon).prop('tooltip'), 'Data Lens');
      assert.equal(elementWithType('new_view').find(AssetTypeIcon).prop('tooltip'), 'Data Lens');
    });
    it('renders the correct tooltip for type "dataset"', () => {
      assert.equal(elementWithType('dataset').find(AssetTypeIcon).prop('tooltip'), 'Dataset');
    });
    it('renders the correct tooltip for type "draft"', () => {
      assert.equal(elementWithType('draft').find(AssetTypeIcon).prop('tooltip'), 'Draft Dataset');
    });
    it('renders the correct tooltip for type "filter"', () => {
      assert.equal(elementWithType('filter').find(AssetTypeIcon).prop('tooltip'), 'Filtered View');
    });
    it('renders the correct tooltip for type "form"', () => {
      assert.equal(elementWithType('form').find(AssetTypeIcon).prop('tooltip'), 'Form');
    });
    it('renders the correct tooltip for type "href"', () => {
      assert.equal(
        elementWithType('href').find(AssetTypeIcon).prop('tooltip'), 'External Dataset'
      );
    });
    it('renders the correct tooltip for type "map"', () => {
      assert.equal(elementWithType('map').find(AssetTypeIcon).prop('tooltip'), 'Map');
    });
    it('renders the correct tooltip for type "pulse"', () => {
      assert.equal(elementWithType('pulse').find(AssetTypeIcon).prop('tooltip'), 'Pulse');
    });
    it('renders the correct tooltip for type "story"', () => {
      assert.equal(elementWithType('story').find(AssetTypeIcon).prop('tooltip'), 'Story');
    });
  });

  it('renders a div with a "name" and "description" for the "name" cell', () => {
    const props = resultListRowProps({
      columns: ['name']
    });
    const element = shallow(<ResultListRow {...props} />);
    const nameCell = element.find('td');
    assert.lengthOf(nameCell.find('a'), 1);
    assert.equal(
      nameCell.find('a').prop('href'), 'https://data.seattle.gov/dataset/blah-blah/cfa5-i2ky'
    );
    assert.equal(nameCell.find('a span.name').text(), 'Haley Joel Osment');
    assert.equal(nameCell.find('span.description').text(),
      'The fifth sense: The sense of smell. The ability to smell crime before it even happens.');
  });
});
