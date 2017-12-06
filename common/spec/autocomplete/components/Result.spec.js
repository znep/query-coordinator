import React from 'react';
import { shallow } from 'enzyme';

// Import the css-moduled ResultClass. If we don't, we'll get warnings
// from React about invalid props (styleName), which are otherwise handled
// via css-modules. Unfortunately, this gives us the css-moduled class-names :(
import { ResultClass } from 'common/autocomplete/components/Results/Result';

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
      const wrapper = shallow(<ResultClass {...getProps({ matchOffsets: [] })} />);
      assert.lengthOf(wrapper.find('span'), 0);
      assert.equal(wrapper.text(), 'An antsy airplane');
    });

    it('adds highlight spans around the matches', () => {
      const wrapper = shallow(<ResultClass {...getProps()} />);
      assert.include(
        wrapper.html(),
        '<span class="highlight">An</span> <span class="highlight">an</span>tsy airplane'
      );
    });

    it('can match an entire name', () => {
      const wrapper = shallow(<ResultClass
        {...getProps({
          name: 'meat',
          matchOffsets: [{ start: 0, length: 4 }]
        })} />
      );
      assert.include(
        wrapper.html(),
        '<span class="highlight">meat</span>'
      );
    });

    it('escapes html in the name', () => {
      const wrapper = shallow(<ResultClass
        {...getProps({
          name: '<script>some bad stuff</script>',
          matchOffsets: [{ start: 8, length: 4 }]
        })} />
      );
      assert.include(
        wrapper.html(),
        '&lt;script&gt;<span class="highlight">some</span> bad stuff&lt;/script&gt;'
      );
    });
  });
});
