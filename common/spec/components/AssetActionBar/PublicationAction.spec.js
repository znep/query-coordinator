import React from 'react';
import ReactDOM from 'react-dom';
import { expect, assert } from 'chai';
import { shallow } from 'enzyme';
import PublicationAction from 'common/components/AssetActionBar/components/publication_action';

describe('components/AssetActionBar/components/PublicationAction', () => {
  const getProps = (publicationState = 'draft', publishedViewUid = 'asdf-1234') => {
    return { publicationState, publishedViewUid };
  };

  it('renders a more actions widget when clicked', () => {
    const element = shallow(<PublicationAction {...getProps()} />);
    expect(element.find('.more-actions')).to.have.length(0);
    element.find('.more-actions-button').simulate('click');
    expect(element.find('.more-actions')).to.have.length(1);
  });

  it('removes the more actions widget when the overlay is clicked', () => {
    const element = shallow(<PublicationAction {...getProps()} />);
    element.find('.more-actions-button').simulate('click');
    expect(element.find('.more-actions')).to.have.length(1);
    element.find('.asset-action-bar-overlay').simulate('click');
    expect(element.find('.more-actions')).to.have.length(0);
  });
});
