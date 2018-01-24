import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';
import { InfoPaneButtons } from 'visualizationCanvas/components/InfoPaneButtons';
import { ModeStates } from 'visualizationCanvas/lib/constants';
import mockView from 'data/mockView';
import mockVif from 'data/mockVif';
import mockParentView from 'data/mockParentView';

describe('InfoPaneButtons', () => {
  const getProps = (props) => {
    const realProps = _.merge(
      {
        onClickEdit: _.noop,
        mode: ModeStates.VIEW,
        view: mockView,
        parentView: mockParentView,
        filters: []
      },
      props
    );
    return realProps;
  };

  it('renders', () => {
    const element = renderComponent(InfoPaneButtons, getProps());

    assert.ok(element);
  });

  describe('export button', () => {
    it('renders in view mode', () => {
      const element = renderComponent(InfoPaneButtons, getProps());
      assert.ok(element.querySelector('.btn-simple.download'));
    });

    it('renders in edit mode', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        mode: ModeStates.EDIT
      }));
      assert.ok(element.querySelector('.btn-simple.download'));
    });
  });

  describe('edit button', () => {
    it('does not render for edit mode', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        mode: ModeStates.EDIT
      }));

      assert.isNull(element.querySelector('.btn-edit'));
    });

    it('does not render for preview mode', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        mode: ModeStates.PREVIEW
      }));

      assert.isNull(element.querySelector('.btn-edit'));
    });

    describe('view mode', () => {
      it('does not render when user lacks a role', () => {
        window.serverConfig = {
          currentUser: {}
        };
        const element = renderComponent(InfoPaneButtons, getProps());

        assert.isNull(element.querySelector('.btn-edit'));
      });

      it('renders for when user has a role', () => {
        window.serverConfig = {
          currentUser: {
            roleName: 'anything'
          }
        };
        const element = renderComponent(InfoPaneButtons, getProps());

        assert.ok(element.querySelector('.btn-edit'));
      });

      it('invokes onClickEdit on click', () => {
        const onClickSpy = sinon.spy();
        const element = renderComponent(InfoPaneButtons, getProps({
          onClickEdit: onClickSpy
        }));

        TestUtils.Simulate.click(element.querySelector('.btn-edit'));

        sinon.assert.called(onClickSpy);
      });
    });
  });
});
