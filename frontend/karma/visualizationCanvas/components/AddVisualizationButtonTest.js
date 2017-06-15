import { assert } from 'chai';
import sinon from 'sinon';
import { AddVisualizationButton } from 'components/AddVisualizationButton';

describe('AddVisualizationButton', () => {
  const getProps = (props) => {
    return {
      hasVisualization: false,
      onClickHandler: _.noop,
      ...props
    };
  };

  it('renders an element if hasVisualization is false', () => {
    const element = renderComponent(AddVisualizationButton, getProps({
      hasVisualization: false
    }));
    assert.ok(element);
  });

  it('invokes onClickHandler on click', () => {
    const onClickSpy = sinon.spy();
    const element = renderComponent(AddVisualizationButton, getProps({
      onClickHandler: onClickSpy
    }));

    TestUtils.Simulate.click(element.querySelector('button'));

    sinon.assert.called(onClickSpy);
  });

  it('does not render a button if hasVisualization is true', () => {
    const element = renderComponent(AddVisualizationButton, getProps({
      hasVisualization: true
    }));

    assert.isNull(element);
  });
});
