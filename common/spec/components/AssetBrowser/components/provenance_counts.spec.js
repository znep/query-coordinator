import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import { ProvenanceCounts } from 'common/components/AssetBrowser/components/provenance_counts';

describe('components/ProvenanceCounts', () => {
  const provenanceCountsProps = (options = {}) => ({
    provenanceCounts: {
      official: 9,
      community: 13
    },
    fetchingProvenanceCounts: false,
    fetchingProvenanceCountsError: false,
    ...options
  });

  it('renders a provenance-counts div', () => {
    const wrapper = shallow(<ProvenanceCounts {...provenanceCountsProps()} />);
    assert.isNotNull(wrapper);
    assert.isTrue(wrapper.hasClass('provenance-counts'));
  });

  it('does not render a provenance-counts-item for an item with zero counts', () => {
    const wrapper = shallow(
      <ProvenanceCounts
        {...provenanceCountsProps({
          provenanceCounts: {
            official: 0,
            community: 13
          }
        })} />);
    assert.lengthOf(wrapper.find('.provenance-counts-item'), 1);

    assert.equal(wrapper.find('.provenance-counts-item.community .item-count').text(), '13');
    assert.equal(wrapper.find('.provenance-counts-item.community .item-name').text(), 'Community');
  });

  it('renders provenance-counts-items for both official and community', () => {
    const wrapper = shallow(<ProvenanceCounts {...provenanceCountsProps()} />);
    assert.lengthOf(wrapper.find('.provenance-counts-item'), 2);

    assert.equal(wrapper.find('.provenance-counts-item.official .item-count').text(), '9');
    assert.equal(wrapper.find('.provenance-counts-item.official .item-name').text(), 'Official');

    assert.equal(wrapper.find('.provenance-counts-item.community .item-count').text(), '13');
    assert.equal(wrapper.find('.provenance-counts-item.community .item-name').text(), 'Community');
  });
});
