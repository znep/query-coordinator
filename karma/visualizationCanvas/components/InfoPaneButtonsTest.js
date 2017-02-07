import { InfoPaneButtons } from 'components/InfoPaneButtons';
import { ModeStates } from 'lib/constants';

describe('InfoPaneButtons', () => {
  const getProps = (props) => {
    return {
      onClickEdit: _.noop,
      mode: ModeStates.VIEW,
      ...props
    };
  };

  it('renders', () => {
    const element = renderComponent(InfoPaneButtons, getProps());

    expect(element).to.exist;
  });

  describe('edit button', () => {
    it('does not render for edit mode', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        mode: ModeStates.EDIT
      }));

      expect(element.querySelector('.btn-edit')).to.not.exist;
    });

    it('does not render for preview mode', () => {
      const element = renderComponent(InfoPaneButtons, getProps({
        mode: ModeStates.PREVIEW
      }));

      expect(element.querySelector('.btn-edit')).to.not.exist;
    });

    describe('view mode', () => {
      it('does not render when user is not admin or publisher', () => {
        window.serverConfig = {
          currentUser: {
            roleName: 'user'
          }
        };
        const element = renderComponent(InfoPaneButtons, getProps());

        expect(element.querySelector('.btn-edit')).to.not.exist;
      });

      it('renders for when user is admin or publisher', () => {
        window.serverConfig = {
          currentUser: {
            roleName: 'administrator'
          }
        };
        const element = renderComponent(InfoPaneButtons, getProps());

        expect(element.querySelector('.btn-edit')).to.exist;
      });

      it('invokes onClickEdit on click', () => {
        const onClickSpy = sinon.spy();
        const element = renderComponent(InfoPaneButtons, getProps({
          onClickEdit: onClickSpy
        }));

        TestUtils.Simulate.click(element.querySelector('.btn-edit'));

        expect(onClickSpy).to.have.been.called;
      });
    });
  });
});
