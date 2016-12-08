import { AddVisualizationButton } from 'components/AddVisualizationButton';
import mockVif from 'data/mockVif';

describe('AddVisualizationButton', () => {
  const getProps = (props) => {
    return {
      vifs: [],
      openAuthoringWorkflowModal: _.noop,
      ...props
    };
  };

  it('renders an element', () => {
    const element = renderPureComponent(AddVisualizationButton(getProps()));
    expect(element).to.exist;
  });

  it('invokes openAuthoringWorkflowModal on click', () => {
    const onClickSpy = sinon.spy();
    const element = renderPureComponent(AddVisualizationButton(getProps({
      openAuthoringWorkflowModal: onClickSpy
    })));

    TestUtils.Simulate.click(element.querySelector('button'));

    expect(onClickSpy).to.have.been.called;
  });

  it('does not render a button if vifs exist', () => {
    const component = AddVisualizationButton(getProps({
      vifs: [mockVif]
    }));

    expect(component).to.be.null;
  });
});
