import { expect, assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import _ from 'lodash';

import defaultOptions from '../../DefaultOptions';

import ChooseConnection from 'components/ChooseConnection/ChooseConnection';

describe('<ChooseConnection />', () => {
  const optionsWithConnections = _.cloneDeep(defaultOptions);
  optionsWithConnections.connections = [
      {"name": "Montana", "connection": "data.montana.gov", "image": "https://valid-image-path.com/image.png"},
      {"name": "Some Other Connection", "connection": "some-other-connection", "image": "https://valid-image-path.com/image.png"},
      {"name": "Another Connection", "connection": "another-connection"}
  ];

  const defaultProps = {
    translate: () => '',
    onConnectionChosen: () => { },
    setLoginFormVisibility: () => { },
    options: optionsWithConnections
  };

  describe('socrata ID button', () => {
    it('renders socrata ID when hideSocrataId is false', () => {
      const props = _.cloneDeep(defaultProps);
      props.options.hideSocrataId = false;
      const wrapper = shallow(<ChooseConnection {...props} />);
      expect(wrapper.find('.signin-button-socrata-id')).to.have.length(1);
    });

    it('hides socrata ID when hideSocrataId is true', () => {
      const props = _.cloneDeep(defaultProps);
      props.options.hideSocrataId = true;
      const wrapper = shallow(<ChooseConnection {...props} />);
      expect(wrapper.find('.signin-button-socrata-id')).to.have.length(0);
    });
  });

  describe('connection buttons', () => {
    it('renders all connections', () => {
      const wrapper = shallow(<ChooseConnection {...defaultProps} />);

      // length + 1 because "Socrata ID" button
      expect(wrapper.find('a')).to.have.length(optionsWithConnections.connections.length + 1);
    });

    it('renders images', () => {
      const wrapper = shallow(<ChooseConnection {...defaultProps} />);

      // 3 because two of our connections have images and the socrata ID button has one
      expect(wrapper.find('img')).to.have.length(3);
    });
  });
});
