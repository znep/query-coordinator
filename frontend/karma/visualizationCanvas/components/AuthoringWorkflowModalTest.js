import { assert } from 'chai';
import sinon from 'sinon';
import { AuthoringWorkflowModal } from 'components/AuthoringWorkflowModal';
import mockVif from 'data/mockVif';
import { mount, shallow } from 'enzyme';

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

  const getProps = props => {
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
      const props = getProps({
        config: {
          isActive: false
        }
      });

      element = shallow(<AuthoringWorkflowModal {...props} />);
    });

    it('does not render when isActive is false', () => {
      assert.isTrue(element.isEmptyRender());
    });

    it('does not initialize the AuthoringWorkflow if isActive is false', () => {
      assert.equal(element.find('.authoring-modal').length, 0);
    });
  });

  describe('when isActive is true', () => {
    it('renders', () => {
      const element = shallow(<AuthoringWorkflowModal {...getProps()} />);
      assert.isTrue(element.exists());
    });

    it('initializes the AuthoringWorkflow if isActive is true and VIFs are present', () => {
      const element = shallow(<AuthoringWorkflowModal {...getProps()} />);
      assert.equal(element.find('.authoring-workflow-modal').length, 1);
    });

    it('does not initialize the AuthoringWorkflow when VIF is missing', () => {
      const props = getProps({
        config: {
          vifIndex: 0,
          vif: {},
          isActive: true
        }
      });

      const element = mount(<AuthoringWorkflowModal {...props} />);

      assert.equal(element.find('.authoring-modal').length, 0);
    });
  });

  // it('removes the AuthoringWorkflow on unmount', () => {
  // const reactElement = React.createElement(
  //   AuthoringWorkflowModal,
  //   getProps()
  // );
  // const element = TestUtils.renderIntoDocument(reactElement);
  // const node = ReactDOM.findDOMNode(element);
  // element.componentWillUnmount();
  // double check it's nowhere on the document
  // assert.isNull(document.querySelector('.authoring-modal'));
  // });
});
