import React from 'react';
import ReactDOM from 'react-dom';
import { expect, assert } from 'chai';
import { shallow } from 'enzyme';
import AssetActionBar from 'common/components/AssetActionBar';
import ManageAccessButton from 'common/components/AssetActionBar/components/manage_access';
import PublicationAction from 'common/components/AssetActionBar/components/publication_action';
import PublicationState from 'common/components/AssetActionBar/components/publication_state';

describe('components/AssetActionBar', () => {
  const getProps = (publicationStage = 'published') => {
    return { currentView: { name: 'test name', publicationStage } };
  };

  it('has a manage access button', () => {
    const element = shallow(<AssetActionBar {...getProps()} />);
    expect(element.find(ManageAccessButton)).to.have.length(1);
  });

  it('has a publication state widget', () => {
    const element = shallow(<AssetActionBar {...getProps()} />);
    expect(element.find(PublicationState)).to.have.length(1);
  });

  it('has a publication action widget', () => {
    const element = shallow(<AssetActionBar {...getProps()} />);
    expect(element.find(PublicationAction)).to.have.length(1);
  });
});
