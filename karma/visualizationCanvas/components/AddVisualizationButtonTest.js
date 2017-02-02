import { AddVisualizationButton } from 'components/AddVisualizationButton';
import mockVif from 'data/mockVif';

describe('AddVisualizationButton', () => {
  const getProps = (props) => {
    return {
      vifs: [],
      onClickHandler: _.noop,
      ...props
    };
  };

  it('renders an element', () => {
    const element = renderComponent(AddVisualizationButton, getProps());
    expect(element).to.exist;
  });

  it('invokes onClickHandler on click', () => {
    const onClickSpy = sinon.spy();
    const element = renderComponent(AddVisualizationButton, getProps({
      onClickHandler: onClickSpy
    }));

    TestUtils.Simulate.click(element.querySelector('button'));

    expect(onClickSpy).to.have.been.called;
  });

  it('does not render a button if vifs exist', () => {
    const element = renderComponent(AddVisualizationButton, getProps({
      vifs: [mockVif]
    }));

    expect(element).to.be.null;
  });
});
