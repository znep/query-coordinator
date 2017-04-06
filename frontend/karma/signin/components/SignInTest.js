import { expect, assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import _ from 'lodash';

import defaultOptions from '../DefaultOptions';

import SignIn from 'components/SignIn';
import SocialSignIn from 'components/Social/SocialSignIn';

describe('<SignIn />', () => {
  const defaultProps = {
    translate: ( ) => '',
    doAuth0Login: () => { },
    auth0Connections: [],
    setLoginFormVisibility: () => { },
    options: defaultOptions
  };

  describe('social signin', () => {
    it('renders social login when showSocial is true', () => {
      const props = _.cloneDeep(defaultProps);
      props.options.showSocial = true;
      const wrapper = shallow(<SignIn {...props} />);
      expect(wrapper.find(SocialSignIn)).to.have.length(1);
    });

    it('does not render social login when showSocial is false', () => {
      const props = _.cloneDeep(defaultProps);
      props.options.showSocial = false;
      const wrapper = shallow(<SignIn {...props} />);
      expect(wrapper.find(SocialSignIn)).to.have.length(0);
    });
  });
});
