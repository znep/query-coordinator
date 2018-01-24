import { shallow } from 'enzyme';
import { assert } from 'chai';
import { MetadataPane } from 'opMeasure/components/MetadataPane';

describe('MetadataPane', () => {
  const getProps = (props) => {
    return {
      coreView: {},
      measure: {},
      ...props
    };
  };

  it('renders pane content', () => {
    const element = shallow(<MetadataPane {...getProps()} />);

    assert.lengthOf(element.find('[data-pane="metadata"]'), 1);
  });
});
