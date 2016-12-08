import { AuthoringWorkflowModal } from 'components/AuthoringWorkflowModal';
import mockVif from 'data/mockVif';

describe('AuthoringWorkflowModal', () => {
  const getProps = (props) => {
    return {
      config: {
        position: 0,
        vif: mockVif,
        isActive: true
      },
      onCancel: _.noop,
      onComplete: _.noop,
      ...props
    };
  };

  describe('when isActive is false', () => {
    let element;

    beforeEach(() => {
      element = renderComponent(AuthoringWorkflowModal, getProps({
        config: {
          isActive: false
        }
      }));
    });

    it('does not render when isActive is false', () => {
      expect(element).to.not.exist;
    });

    it('does not initialize the AuthoringWorkflow if isActive is false', () => {
      // the element is null, this is assert makes sure that it is not present at all
      expect(document.querySelector('.authoring-modal')).to.not.exist;
    });
  });

  describe('when isActive is true', () => {
    it('renders', () => {
      const element = renderComponent(AuthoringWorkflowModal, getProps());
      expect(element).to.exist;
    });

    it('initializes the AuthoringWorkflow if isActive is true and VIFs are present', () => {
      const element = renderComponent(AuthoringWorkflowModal, getProps());
      expect(element.querySelector('.authoring-modal')).to.exist;
    });

    it('does not initialize the AuthoringWorkflow when VIF is missing', () => {
      const element = renderComponent(AuthoringWorkflowModal, getProps({
        config: {
          position: 0,
          vif: {},
          isActive: true
        }
      }));
      expect(element.querySelector('.authoring-modal')).to.not.exist;
    });
  });

  it('removes the AuthoringWorkflow on unmount', () => {
    const reactElement = React.createElement(AuthoringWorkflowModal, getProps());
    const element = TestUtils.renderIntoDocument(reactElement);
    const node = ReactDOM.findDOMNode(element);

    element.componentWillUnmount();

    // double check it's nowhere on the document
    expect(document.querySelector('.authoring-modal')).to.not.exist;
  });
});
