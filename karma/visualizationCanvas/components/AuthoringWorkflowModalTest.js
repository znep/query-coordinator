import { AuthoringWorkflowModal } from 'components/AuthoringWorkflowModal';
import mockVif from 'data/mockVif';

describe('AuthoringWorkflowModal', () => {
  const getProps = (props) => {
    return {
      config: {
        position: 0,
        vif: mockVif
      },
      onCancel: _.noop,
      onComplete: _.noop,
      ...props
    };
  };

  it('renders an element', () => {
    const element = renderComponent(AuthoringWorkflowModal, getProps());
    expect(element).to.exist;
  });

  it('initializes the AuthoringWorkflow', () => {
    const element = renderComponent(AuthoringWorkflowModal, getProps());
    expect(element.querySelector('.authoring-modal')).to.exist;
  });

  it('does not initialize the AuthoringWorkflow when VIF is missing', () => {
    const element = renderComponent(AuthoringWorkflowModal, getProps({
      config: {
        position: 0,
        vif: {}
      }
    }));
    expect(element.querySelector('.authoring-modal')).to.not.exist;
  });

  it('removes the AuthoringWorkflow on unmount', () => {
    const reactElement = React.createElement(AuthoringWorkflowModal, getProps());
    const element = TestUtils.renderIntoDocument(reactElement);
    const node = ReactDOM.findDOMNode(element);

    element.componentWillUnMount();

    expect(node.querySelector('.authoring-modal')).to.not.exist;
  });
});
