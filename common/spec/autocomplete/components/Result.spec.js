import React from 'react';
import { shallow } from 'enzyme';

import { Result } from 'common/autocomplete/components/Results/Result';

describe('<Result />', () => {
  const resultProps = {
    focused: true,
    index: 0,
    matchOffsets: [{ start: 0, length: 2 }, { start: 3, length: 2 }],
    name: 'An antsy airplane',
    onChooseResult: () => {},
    onResultFocusChanged: () => {},
    onQueryChanged: () => {},
    onResultsVisibilityChanged: () => {}
  };

  const getProps = (props = {}) => ({ ...resultProps, ...props });

  describe('displayTitle', () => {
    it('does not add any highlight spans if there are no matchOffsets', () => {
      const wrapper = shallow(<Result {...getProps({ matchOffsets: [] })} />);
      expect(wrapper.html()).to.equal('<div>An antsy airplane</div>');
    });

    it('adds highlight spans around the matches', () => {
      const wrapper = shallow(<Result {...getProps()} />);
      expect(wrapper.html()).to.equal(
        '<div><span class="highlight">An</span> <span class="highlight">an</span>tsy airplane</div>'
      );
    });

    it('can match an entire name', () => {
      const wrapper = shallow(<Result {...getProps({
        name: 'meat',
        matchOffsets: [{ start: 0, length: 4 }]
      })} />);
      expect(wrapper.html()).to.equal(
        '<div><span class="highlight">meat</span></div>'
      );
    });

    it('escapes html in the name', () => {
      const wrapper = shallow(<Result {...getProps({
        name: '<script>some bad stuff</script>',
        matchOffsets: [{ start: 8, length: 4 }]
      })} />);
      expect(wrapper.html()).to.equal(
        '<div>&lt;script&gt;<span class="highlight">some</span> bad stuff&lt;/script&gt;</div>'
      );
    });
  });
});
