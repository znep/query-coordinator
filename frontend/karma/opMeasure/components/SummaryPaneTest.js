import { assert } from 'chai';
import { SummaryPane } from 'components/SummaryPane';

describe('SummaryPane', () => {
  const getProps = (props) => {
    return {
      activePane: 'summary',
      ...props
    };
  };

  it('renders pane content if it is the active pane', () => {
    const element = renderComponent(SummaryPane, getProps());

    assert.ok(element);
    assert.ok(element.querySelector('.metadata-section'));
    assert.ok(element.querySelector('.summary-pane-description'));
  });

  it('renders nothing if it is not the active pane', () => {
    const element = renderComponent(SummaryPane, getProps({
      activePane: 'other'
    }));

    assert.isNull(element);
  });
});
