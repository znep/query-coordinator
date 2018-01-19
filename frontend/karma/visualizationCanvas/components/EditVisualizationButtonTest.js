import sinon from 'sinon';
import { assert } from 'chai';
import { EditVisualizationButton } from 'visualizationCanvas/components/EditVisualizationButton';

describe('EditVisualizationButton', () => {
  const getProps = (props) => {
    return {
      onClickHandler: _.noop,
      vifIndex: 0,
      ...props
    };
  };

  it('renders an element', () => {
    const element = renderComponent(EditVisualizationButton, getProps());
    assert.ok(element);
  });

  it('invokes openAuthoringWorkflowModal on click', () => {
    const onClickSpy = sinon.spy();
    const element = renderComponent(EditVisualizationButton, getProps({
      onClickHandler: onClickSpy
    }));

    TestUtils.Simulate.click(element);

    sinon.assert.called(onClickSpy);
  });
});
