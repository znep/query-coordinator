import React from 'react';
import { shallow } from 'enzyme';

import { ContainerClass } from 'components/Container';
import CollapsedIcon from 'components/CollapsedIcon';

/* Note that in these tests noop functions are passed in as props to satisfy propTypes requirements */
describe('<Container />', () => {
  describe('collapsable', () => {
    it('renders collapsed when collapsible & collapsed are true', () => {
      const wrapper = shallow(
        <ContainerClass
          collapsed={true}
          collapsible={true}
          onResultVisibilityChanged={() => {}}
          millisecondsBeforeSearch={0}
          getResults={() => {}} />
      );

      expect(wrapper.find(CollapsedIcon)).to.have.length(1);
    });

    it('renders un-collapsed when collapsible & collapsed are false', () => {
      const wrapper = shallow(
        <ContainerClass
          collapsed={false}
          collapsible={false}
          onResultVisibilityChanged={() => {}}
          millisecondsBeforeSearch={0}
          getResults={() => {}} />
      );

      expect(wrapper.find(CollapsedIcon)).to.have.length(0);
    });

    it('renders un-collapsed when collapsible is false even if collapsed is true', () => {
      const wrapper = shallow(
        <ContainerClass
          collapsed={true}
          collapsible={false}
          onResultVisibilityChanged={() => {}}
          millisecondsBeforeSearch={0}
          getResults={() => {}} />
      );

      expect(wrapper.find(CollapsedIcon)).to.have.length(0);
    });
  });
});
