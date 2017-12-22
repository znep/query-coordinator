import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import { AssetSelector } from 'common/components/AssetSelector/index';
import { Modal, ModalHeader, ModalContent } from 'common/components/Modal';

const getProps = (props = {}) => ({
  additionalTopbarComponents: [],
  baseFilters: {},
  onClose: () => {},
  onAssetSelected: () => {},
  renderInModal: true,
  resultsPerPage: 6,
  title: 'Hi',
  ...props
});

describe('components/AssetSelector', () => {

  describe('renderInModal', () => {

    it('renders in a modal when true', () => {
      const wrapper = shallow(<AssetSelector {...getProps({ renderInModal: true })} />);
      assert.isTrue(wrapper.hasClass('asset-selector'));
      assert.isTrue(wrapper.find(Modal).exists());
      assert.isTrue(wrapper.find(ModalHeader).exists());
      assert.isTrue(wrapper.find(ModalContent).exists());
    });

    it('renders in a non-modal div when false', () => {
      const wrapper = shallow(<AssetSelector {...getProps({ renderInModal: false })} />);
      assert.isTrue(wrapper.hasClass('asset-selector'));
      assert.isFalse(wrapper.find(Modal).exists());
      assert.isFalse(wrapper.find(ModalHeader).exists());
      assert.isFalse(wrapper.find(ModalContent).exists());
    });
  });
});
