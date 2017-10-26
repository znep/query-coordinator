import React from 'react';
import { shallow } from 'enzyme';

import { AutocompleteClass } from 'common/autocomplete/components/Autocomplete';
import CollapsedIcon from 'common/autocomplete/components/CollapsedIcon';

/* Note that in these tests noop functions are passed in as props to satisfy propTypes requirements */
describe('<Autocomplete />', () => {
  describe('collapsable', () => {
    it('renders collapsed when collapsible & collapsed are true', () => {
      const wrapper = shallow(
        <AutocompleteClass
          collapsed
          collapsible
          onResultVisibilityChanged={() => {}}
          millisecondsBeforeSearch={0}
          getSearchResults={() => {}} />
      );

      expect(wrapper.find(CollapsedIcon)).to.have.length(1);
    });

    it('renders un-collapsed when collapsible & collapsed are false', () => {
      const wrapper = shallow(
        <AutocompleteClass
          collapsed={false}
          collapsible={false}
          onResultVisibilityChanged={() => {}}
          millisecondsBeforeSearch={0}
          getSearchResults={() => {}} />
      );

      expect(wrapper.find(CollapsedIcon)).to.have.length(0);
    });

    it('renders un-collapsed when collapsible is false even if collapsed is true', () => {
      const wrapper = shallow(
        <AutocompleteClass
          collapsed
          collapsible={false}
          onResultVisibilityChanged={() => {}}
          millisecondsBeforeSearch={0}
          getSearchResults={() => {}} />
      );

      expect(wrapper.find(CollapsedIcon)).to.have.length(0);
    });
  });
});
