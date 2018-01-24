import { assert } from 'chai';
import sinon from 'sinon';
import { AddVisualizationButton } from 'visualizationCanvas/components/AddVisualizationButton';

describe('AddVisualizationButton', () => {
  const getProps = (props) => {
    return {
      hasVisualization: false,
      onClickHandler: _.noop,
      ...props
    };
  };

  it('renders an active button if hasVisualization is false', () => {
    const element = renderComponent(AddVisualizationButton, getProps({
      hasVisualization: false
    }));
    const btn = element.querySelector('button');

    assert.ok(element);
    assert.isFalse(btn.hasAttribute('disabled'));
  });

  it('invokes onClickHandler on click', () => {
    const onClickSpy = sinon.spy();
    const element = renderComponent(AddVisualizationButton, getProps({
      onClickHandler: onClickSpy
    }));

    TestUtils.Simulate.click(element.querySelector('button'));

    sinon.assert.called(onClickSpy);
  });

  it('disables the button if hasVisualization is true', () => {
    const element = renderComponent(AddVisualizationButton, getProps({
      hasVisualization: true
    }));
    const btn = element.querySelector('button');

    assert.isTrue(btn.hasAttribute('disabled'));
  });
});
