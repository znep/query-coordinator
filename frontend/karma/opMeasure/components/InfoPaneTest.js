import _ from 'lodash';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import InfoPane, { mapStateToProps } from 'components/InfoPane';

describe('InfoPane', () => {
  it('renders', () => {
    const element = renderComponentWithStore(InfoPane);
    assert.ok(element);
  });

  describe('mapStateToProps', () => {
    const mutationRights = ['add', 'delete', 'update_view', 'write'];
    const readOnlyRights = ['read'];
    const getMockState = () => {
      return {
        view: {
          mode: 'EDIT',
          coreView: {
            rights: mutationRights
          }
        }
      };
    };

    describe('renderButtons()', () => {
      describe('in edit mode', () => {
        it('does not render an edit button', () => {
          const state = getMockState();
          const props = mapStateToProps(state);
          const buttons = shallow(props.renderButtons());

          assert.equal(buttons.find('.btn-edit').length, 0);
        });
      });

      describe('in view mode', () => {
        it('does not render an edit button if view has no rights', () => {
          const state = getMockState();
          _.set(state, 'view.mode', 'VIEW');
          _.set(state, 'view.coreView.rights', []);

          const props = mapStateToProps(state);
          const buttons = shallow(props.renderButtons());

          assert.equal(buttons.find('.btn-edit').length, 0);
        });

        it('does not render an edit button if view only contains read rights', () => {
          const state = getMockState();
          _.set(state, 'view.mode', 'VIEW');
          _.set(state, 'view.coreView.rights', readOnlyRights);

          const props = mapStateToProps(state);
          const buttons = shallow(props.renderButtons());

          assert.equal(buttons.find('.btn-edit').length, 0);
        });

        it('returns an edit button if view contains mutation rights', () => {
          const state = getMockState();
          _.set(state, 'view.mode', 'VIEW');
          _.set(state, 'view.coreView.rights', mutationRights);

          const props = mapStateToProps(state);
          const buttons = shallow(props.renderButtons());

          assert.equal(buttons.find('.btn-edit').length, 1);
        });
      });
    });
  });
});
