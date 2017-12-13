import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { FeatureFlags } from 'common/feature_flags';
import ResultCard from 'common/components/AssetBrowser/components/result_card';

describe('components/ResultCard', () => {
  const defaultProps = {
    categories: ['Fun'],
    description: 'jorts and other denim articles of clothing',
    id: 'abcd-1234',
    isFederated: false,
    isPublic: true,
    link: 'http://davidhasselhoffonline.com/',
    name: 'David Hasselhoff',
    previewImageUrl: 'https://opendata-demo.test-socrata.com/views/7237-mge9/files/573050a0-c39e-4cd5-bdd1-38f12f5f1e84',
    provenance: 'official',
    selectMode: true,
    tags: [],
    type: 'dataset',
    updatedAt: '2016-12-15T12:52:12.006Z',
    viewCount: 9999999
  };

  const resultCardProps = (props = {}) => ({ ...defaultProps, ...props });

  it('renders a selection overlay in selectMode', () => {
    const wrapper = mount(<ResultCard selectMode />);
    assert.isDefined(wrapper);
    assert.lengthOf(wrapper.find('.hover-target'), 1);
  });

  it('does not render a selection overlay without selectMode', () => {
    const wrapper = mount(<ResultCard selectMode={false} />);
    assert.isDefined(wrapper);
    assert.lengthOf(wrapper.find('.hover-target'), 0);
  });

  it('renders a card with correct data', () => {
    const wrapper = mount(<ResultCard {...resultCardProps()} />);
    assert.isDefined(wrapper);
    assert.equal(wrapper.find('.entry-title').text(), 'David Hasselhoff');
    assert.equal(wrapper.find('.entry-description').text(), 'jorts and other denim articles of clothing');
    assert.equal(wrapper.find('.first').find('.date').text(), 'December 15, 2016');
    assert.lengthOf(wrapper.find('.entry-view-type .socrata-icon-dataset'), 1);
    assert.lengthOf(wrapper.find('.entry-main a[href="http://davidhasselhoffonline.com/"]'), 1);
  });

  it('calls onSelect and onClose on click', () => {
    const onCloseSpy = sinon.spy();
    const onSelectSpy = sinon.spy();
    const wrapper = mount(<ResultCard {...resultCardProps({ onClose: onCloseSpy, onSelect: onSelectSpy })} />);
    wrapper.find('.hover-target').simulate('click');
    sinon.assert.calledOnce(onCloseSpy);
    sinon.assert.calledOnce(onSelectSpy);
  });

  it('calls onSelect with the mapped props', () => {
    const onSelectSpy = sinon.spy();
    const wrapper = mount(<ResultCard {...resultCardProps({ onSelect: onSelectSpy })} />);
    wrapper.find('.hover-target').simulate('click');
    sinon.assert.calledWith(onSelectSpy, {
      name: 'David Hasselhoff',
      description: 'jorts and other denim articles of clothing',
      displayType: 'dataset',
      id: 'abcd-1234',
      imageUrl: 'https://opendata-demo.test-socrata.com/views/7237-mge9/files/573050a0-c39e-4cd5-bdd1-38f12f5f1e84',
      isPrivate: false,
      updatedAt: '2016-12-15T12:52:12.006Z',
      url: 'http://davidhasselhoffonline.com/',
      viewCount: 9999999
    });
  });
});
