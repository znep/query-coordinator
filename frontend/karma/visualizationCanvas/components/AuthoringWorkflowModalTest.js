import { assert } from 'chai';
import sinon from 'sinon';
import { AuthoringWorkflowModal } from 'components/AuthoringWorkflowModal';
import mockVif from 'data/mockVif';

describe('AuthoringWorkflowModal', () => {
  let server;

  beforeEach(() => {
    // This stubs the Authoring Workflow's data requests.
    server = sinon.fakeServer.create();
    server.respondWith([200, { 'Content-Type': 'application/json' }, '{}']);
  });

  afterEach(() => {
    server.restore();
  });

  const getProps = (props) => {
    return {
      config: {
        vifIndex: 0,
        vif: mockVif,
        isActive: true
      },
      filters: [],
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
      assert.isNull(element);
    });

    it('does not initialize the AuthoringWorkflow if isActive is false', () => {
      // the element is null, this is assert makes sure that it is not present at all
      assert.isNull(document.querySelector('.authoring-modal'));
    });
  });

  describe('when isActive is true', () => {
    it('renders', () => {
      const element = renderComponent(AuthoringWorkflowModal, getProps());
      assert.ok(element);
    });

    it('initializes the AuthoringWorkflow if isActive is true and VIFs are present', () => {
      const element = renderComponent(AuthoringWorkflowModal, getProps());
      assert.ok(element.querySelector('.authoring-modal'));
    });

    it('does not initialize the AuthoringWorkflow when VIF is missing', () => {
      const element = renderComponent(AuthoringWorkflowModal, getProps({
        config: {
          vifIndex: 0,
          vif: {},
          isActive: true
        }
      }));
      assert.isNull(element.querySelector('.authoring-modal'));
    });
  });

  it('removes the AuthoringWorkflow on unmount', () => {
    const reactElement = React.createElement(AuthoringWorkflowModal, getProps());
    const element = TestUtils.renderIntoDocument(reactElement);
    const node = ReactDOM.findDOMNode(element);

    element.componentWillUnmount();

    // double check it's nowhere on the document
    assert.isNull(document.querySelector('.authoring-modal'));
  });
});
