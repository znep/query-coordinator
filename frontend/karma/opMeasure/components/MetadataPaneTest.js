import { assert } from 'chai';
import { MetadataPane } from 'components/MetadataPane';

describe('MetadataPane', () => {
  const getProps = (props) => {
    return {
      activePane: 'metadata',
      ...props
    };
  };

  it('renders pane content if it is the active pane', () => {
    const element = renderComponent(MetadataPane, getProps());

    assert.ok(element);
  });

  it('renders nothing if it is not the active pane', () => {
    const element = renderComponent(MetadataPane, getProps({
      activePane: 'other'
    }));

    assert.isNull(element);
  });
});
