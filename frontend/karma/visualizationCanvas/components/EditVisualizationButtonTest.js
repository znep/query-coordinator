import { EditVisualizationButton } from 'components/EditVisualizationButton';

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
    expect(element).to.exist;
  });

  it('invokes openAuthoringWorkflowModal on click', () => {
    const onClickSpy = sinon.spy();
    const element = renderComponent(EditVisualizationButton, getProps({
      onClickHandler: onClickSpy
    }));

    TestUtils.Simulate.click(element);

    expect(onClickSpy).to.have.been.called;
  });
});
