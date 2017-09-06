import { shallow } from 'enzyme';
import { assert } from 'chai';
import { MetadataPane } from 'components/MetadataPane';

describe('MetadataPane', () => {
  const getProps = (props) => {
    return {
      activePane: 'metadata',
      measure: {
        coreView: {}
      },
      ...props
    };
  };

  it('renders pane content if it is the active pane', () => {
    const element = shallow(<MetadataPane {...getProps()} />);

    assert.lengthOf(element.find('[data-pane="metadata"]'), 1);
  });

  it('renders nothing if it is not the active pane', () => {
    const element = shallow(<MetadataPane {...getProps({
      activePane: 'other'
    })} />);

    assert.isTrue(element.isEmptyRender());
  });
});
