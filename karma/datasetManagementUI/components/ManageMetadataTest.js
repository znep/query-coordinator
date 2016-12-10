import _ from 'lodash';
import { ManageMetadata } from 'components/ManageMetadata';
import { statusSavedOnServer, statusDirty } from 'lib/database/statuses';

describe('components/ManageMetadata', () => {

  const defaultProps = {
    view: {
      __status__: statusSavedOnServer,
      name: 'a name',
      description: 'a description',
      category: 'category',
      tags: ['a tag'],
      rowLabel: 'row label'
    },
    onChange: _.noop,
    onSave: _.noop,
    onDismiss: _.noop
  };

  it('renders without errors', () => {
    const element = renderPureComponent(ManageMetadata(defaultProps));
    expect(element).to.exist;
  });

  it('renders an element', () => {
    const element = renderPureComponent(ManageMetadata(defaultProps));
    expect(element).to.exist;
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
    it('isn\'t invoked when you click save if the view isn\'t dirty', () => {
      const stub = sinon.stub();

      const element = renderPureComponent(ManageMetadata({
        ...defaultProps,
        onSave: stub
      }));

      TestUtils.Simulate.click(element.querySelector('#save'));
      expect(stub.called).to.eq(false);
    });

    it('is invoked when you click save if the view is dirty', () => {
      const stub = sinon.stub();

      const dirtyView = {
        ...defaultProps.view,
        __status__: statusDirty(defaultProps.view)
      };

      const propsWithDirtyView = {
        ...defaultProps,
        view: dirtyView
      };

      const element = renderPureComponent(ManageMetadata({
        ...propsWithDirtyView,
        onSave: stub
      }));

      TestUtils.Simulate.click(element.querySelector('#save'));
      expect(stub.called).to.eq(true);
    });
  });

});
