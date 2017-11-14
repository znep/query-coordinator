import React from 'react';
import ReactDOM from 'react-dom';
import { expect, assert } from 'chai';
import AssetActionBar from 'common/components/AssetActionBar';
import PublicationAction from 'common/components/AssetActionBar/components/publication_action';
import PublicationState from 'common/components/AssetActionBar/components/publication_state';
import ShareButton from 'common/components/AssetActionBar/components/share_button';
import { shallow } from 'enzyme';

describe('components/AssetActionBar', () => {
  it('has a share button', () => {
    const element = shallow(<AssetActionBar />);
    expect(element.find(ShareButton)).to.have.length(1);
  });

  it('has a publication state widget', () => {
    const element = shallow(<AssetActionBar />);
    expect(element.find(PublicationState)).to.have.length(1);
  });
});

describe('components/AssetActionBar/PublicationState', () => {
  it('renders a publication action widget when clicked', () => {
    const element = shallow(<PublicationState />);
    expect(element.find(PublicationAction)).to.have.length(0);
    element.find('.publication-state-display').simulate('click');
    expect(element.find(PublicationAction)).to.have.length(1);
  });

  it('removes the publication action when the overlay is clicked', () => {
    const element = shallow(<PublicationState />);
    element.find('.publication-state-display').simulate('click');
    expect(element.find(PublicationAction)).to.have.length(1);
    element.find('.asset-action-bar-overlay').simulate('click');
    expect(element.find(PublicationAction)).to.have.length(0);
  });
});
