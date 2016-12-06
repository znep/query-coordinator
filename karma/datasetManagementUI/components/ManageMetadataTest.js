import _ from 'lodash';
import { ManageMetadata } from 'components/ManageMetadata';

describe('ManageMetadata', () => {
  const defaultProps = {
    metadata: {
      name: 'a name',
      description: 'a description',
      category: 'category',
      tags: ['a tag'],
      rowLabel: 'row label',
      modalOpen: true
    },
    onChange: _.noop,
    onSave: _.noop,
    onDismiss: _.noop
  };

  it('renders an element', () => {
    const element = renderPureComponent(ManageMetadata(defaultProps));
    expect(element).to.exist;
  });

  it('does not create a component if modalOpen is false', () => {
    const element = ManageMetadata({
      ...defaultProps,
      metadata: {
        ...defaultProps.metadata,
        modalOpen: false
      }
    });

    expect(element).to.eq(null);
  });

  it('renders a title', () => {
    const element = renderPureComponent(ManageMetadata(defaultProps));
    expect(element.innerText).to.contain(I18n.home_pane.metadata);
  });

  describe('onDismiss handling', () => {

    let stub;
    let element;

    beforeEach(() => {
      stub = sinon.stub();

      element = renderPureComponent(ManageMetadata({
        ...defaultProps,
        onDismiss: stub
      }));
    });

    it('is invoked when you click cancel', () => {
      TestUtils.Simulate.click(element.querySelector('#cancel'));
      expect(stub.called).to.eq(true);
    });

    it('is invoked when you click the x', () => {
      TestUtils.Simulate.click(element.querySelector('.modal-header-dismiss'));
      expect(stub.called).to.eq(true);
    });
  });

  describe('onSave handling', () => {
    it('is invoked when you click save', () => {
      const stub = sinon.stub();

      const element = renderPureComponent(ManageMetadata({
        ...defaultProps,
        onSave: stub
      }));

      TestUtils.Simulate.click(element.querySelector('#save'));
      expect(stub.called).to.eq(true);
    });
  });
});
