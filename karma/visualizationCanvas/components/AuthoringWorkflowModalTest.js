import {
  AuthoringWorkflowModal,
  __RewireAPI__ as AuthoringWorkflowModalRewireApi
} from 'components/AuthoringWorkflowModal';
import mockVif from 'data/mockVif';

describe('AuthoringWorkflowModal', () => {
  let AuthoringWorkflowStub;

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

  beforeEach(() => {
    AuthoringWorkflowStub = sinon.stub();
    AuthoringWorkflowModalRewireApi.__Rewire__('AuthoringWorkflow', AuthoringWorkflowStub);
  });

  afterEach(() => {
    AuthoringWorkflowModalRewireApi.__ResetDependency__('AuthoringWorkflow');
  });

  it('renders an element', () => {
    const element = renderComponent(AuthoringWorkflowModal, getProps());
    expect(element).to.exist;
  });

  it('initializes the AuthoringWorkflow', () => {
    const element = renderComponent(AuthoringWorkflowModal, getProps());
    expect(AuthoringWorkflowStub).to.have.been.calledWithNew;
  });

  it('does not initialize the AuthoringWorkflow when VIF is missing', () => {
    const element = renderComponent(AuthoringWorkflowModal, getProps({
      config: {
        position: 0,
        vif: {}
      }
    }));
    expect(AuthoringWorkflowStub).to.not.have.been.calledWithNew;
  });

  it('calls destroy on unmount', () => {
    const destroySpy = sinon.spy();
    AuthoringWorkflowStub.returns({
      destroy: destroySpy
    });
    const reactElement = React.createElement(AuthoringWorkflowModal, getProps());
    const element = TestUtils.renderIntoDocument(reactElement);

    element.componentWillUnMount();

    expect(destroySpy).to.have.been.calledOnce;
  });
});
