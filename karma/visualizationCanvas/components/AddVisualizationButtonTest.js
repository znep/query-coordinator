import { AddVisualizationButton } from 'components/AddVisualizationButton';

describe('AddVisualizationButton', () => {
  let element;
  let onClickSpy;

  before(() => {
    onClickSpy = sinon.spy();

    element = renderPureComponent(AddVisualizationButton({
      openAuthoringWorkflowModal: onClickSpy
    }));
  });

  it('renders an element', () => {
    expect(element).to.exist;
  });

  it('invokes openAuthoringWorkflowModal on click', () => {
    TestUtils.Simulate.click(element);
    expect(onClickSpy).to.have.been.called;
  });
});
