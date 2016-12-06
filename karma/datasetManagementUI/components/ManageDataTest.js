import _ from 'lodash';
import { ManageData } from 'components/ManageData';

describe('ManageData', () => {
  const defaultProps = {
    modalOpen: true,
    onDismiss: _.noop
  };

  it('renders an element', () => {
    const element = renderPureComponent(ManageData(defaultProps));
    expect(element).to.exist;
  });

  it('does not create a component if modalOpen is false', () => {
    const element = ManageData({
      ...defaultProps,
      modalOpen: false
    });

    expect(element).to.eq(null);
  });

  it('renders a title', () => {
    const element = renderPureComponent(ManageData(defaultProps));
    expect(element.innerText).to.contain(I18n.home_pane.data);
  });

  describe('onDismiss handling', () => {

    let stub;
    let element;

    beforeEach(() => {
      stub = sinon.stub();

      element = renderPureComponent(ManageData({
        ...defaultProps,
        onDismiss: stub
      }));
    });

    it('is invoked when you click cancel', () => {
      TestUtils.Simulate.click(element.querySelector('#cancel'));
      expect(stub.called).to.eq(true);
    });

    it('is invoked when you click save', () => {
      TestUtils.Simulate.click(element.querySelector('#save'));
      expect(stub.called).to.eq(true);
    });

    it('is invoked when you click the x', () => {
      TestUtils.Simulate.click(element.querySelector('.modal-header-dismiss'));
      expect(stub.called).to.eq(true);
    });
  });

});
