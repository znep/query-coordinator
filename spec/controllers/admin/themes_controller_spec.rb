require 'rails_helper'

RSpec.describe Admin::ThemesController, type: :controller do
  let(:story_theme_json) { JSON.parse(fixture('story_theme.json').read).first }
  let(:theme) { Theme.from_core_config(story_theme_json) }

  let(:theme_attrs) do
    {
      'title' => 'Some title',
      'description' => 'A description',
      'google_font_code' => "<link href='https://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>",
      'css_variables' => {
        '$base-type-size' => 'foo',
        '$base-line-height' => 'bar'
      }
    }
  end

  before do
    allow(Theme).to receive(:find).with(theme.id.to_s).and_return(theme)
  end

  context 'when user is unauthenticated' do
    before do
      stub_invalid_session
    end

    it 'access to #index is forbidden' do
      get :index
      expect(response).to be_redirect
    end

    it 'access to #new is forbidden' do
      get :new
      expect(response).to be_redirect
    end

    it 'access to #edit is forbidden' do
      get :edit, id: 1234
      expect(response).to be_redirect
    end

    it 'access to #create is forbidden' do
      post :create, theme: theme_attrs
      expect(response).to be_redirect
    end

    it 'access to #update is forbidden' do
      put :update, id: theme.id, theme: theme_attrs
      expect(response).to be_redirect
    end

    it 'access to #destroy is forbidden' do
      delete :destroy, id: theme.id
      expect(response).to be_redirect
    end
  end

  context 'when signed-in user is not super admin' do
    before do
      stub_valid_session
    end

    it 'access to #index is forbidden' do
      get :index
      expect(response).to be_redirect
    end

    it 'access to #new is forbidden' do
      get :new
      expect(response).to be_redirect
    end

    it 'access to #edit is forbidden' do
      get :edit, id: 1234
      expect(response).to be_redirect
    end

    it 'access to #create is forbidden' do
      post :create, theme: theme_attrs
      expect(response).to be_redirect
    end

    it 'access to #update is forbidden' do
      put :update, id: theme.id, theme: theme_attrs
      expect(response).to be_redirect
    end

    it 'access to #destroy is forbidden' do
      delete :destroy, id: theme.id
      expect(response).to be_redirect
    end
  end

  context 'when signed-in user is super admin' do
    before do
      stub_super_admin_session
    end

    describe '#index' do
      let(:custom_themes) { double() }

      before do
        allow(Theme).to receive(:all_custom_for_current_domain).and_return(custom_themes)
        get :index
      end

      it 'renders 200' do
        expect(response).to be_success
      end

      it 'renders index template' do
        expect(response).to render_template('index')
      end

      it 'assigns :custom_themes' do
        expect(assigns(:custom_themes)).to eq(custom_themes)
      end
    end

    describe '#new' do
      before do
        get :new
      end

      it 'renders 200' do
        expect(response).to be_success
      end

      it 'renders new template' do
        expect(response).to render_template('new')
      end

      it 'assigns a new theme object' do
        expect(assigns(:theme)).to be_a(Theme)
        expect(assigns(:theme)).to_not be_persisted
      end
    end

    describe '#edit' do
      before do
        get :edit, id: theme
      end

      it 'renders success' do
        expect(response).to be_success
      end

      it 'renders edit template' do
        expect(response).to render_template('edit')
      end

      it 'assigns :theme' do
        expect(assigns(:theme)).to eq(theme)
      end
    end

    describe '#create' do
      context 'with valid attributes' do
        before do
          allow_any_instance_of(Theme).to receive(:save).and_return(true)
        end

        it 'redirects to index' do
          post :create, theme: theme_attrs
          expect(response).to redirect_to(action: 'index')
        end

        it 'sets flash message' do
          post :create, theme: theme_attrs
          expect(flash[:success]).to eq("Successfully created theme, #{theme_attrs['title']}")
        end

        it 'merges domain cname into theme params' do
          request.host = 'sillydomain.com'
          expect(Theme).to receive(:new).
            with(theme_attrs.merge('domain_cname' => 'sillydomain.com')).
            and_return(double('theme').as_null_object)
          post :create, theme: theme_attrs
        end

        # We have set `config.action_controller.action_on_unpermitted_parameters = :raise`
        # in development and test mode to catch potential coding errors when adding
        # css variables to the custom theme config. See Theme.default_css_variables for more info
        it 'filters raises with unknown css_variables' do
          request.host = 'sillydomain.com'
          theme_attrs['css_variables'].merge!('$blah' => 'foo')
          expect {
            post :create, theme: theme_attrs
          }.to raise_error(ActionController::UnpermittedParameters)
        end
      end

      context 'with invalid attributes' do
        before do
          expect_any_instance_of(Theme).to receive(:save).and_return(false)
        end

        it 'renders new with theme' do
          post :create, theme: theme_attrs
          expect(response).to render_template('new')
        end

        it 'sets flash message' do
          allow_any_instance_of(Theme).to receive(:errors).and_return(:errors_message)
          post :create, theme: theme_attrs
          expect(flash[:error]).to eq(:errors_message)
        end
      end
    end

    describe '#destroy' do
      before do
        allow(theme).to receive(:destroy).and_return(nil)
        delete :destroy, id: theme
      end

      it 'destroys theme' do
        expect(theme).to have_received(:destroy)
      end

      it 'redirects to index' do
        expect(response).to redirect_to(action: 'index')
      end

      it 'sets flash message' do
        expect(flash[:success]).to eq("Successfully deleted theme, #{theme.title}.")
      end
    end

    describe '#update' do
      before do
        allow(theme).to receive(:update_attributes).and_return(true)
      end

      it 'renders edit template' do
        put :update, id: theme.id, theme: theme_attrs
        expect(response).to render_template('edit')
      end

      it 'merges request host into params' do
        request.host = 'somehostname.com'
        expected = theme_attrs.merge('domain_cname' => 'somehostname.com')
        expect(theme).to receive(:update_attributes).with(expected)
        put :update, id: theme.id, theme: theme_attrs
      end

      context 'when successful update' do
        before do
          allow(theme).to receive(:update_attributes).and_return(true)
        end

        it 'sets flash success' do
          put :update, id: theme.id, theme: theme_attrs
          expect(flash[:success]).to eq('Successfully updated theme config')
        end
      end

      context 'when unsuccessful update' do
        before do
          allow(theme).to receive(:update_attributes).and_return(false)
          allow(theme).to receive(:errors).and_return(:errors_message)
        end

        it 'sets flash error' do
          put :update, id: theme.id, theme: theme_attrs
          expect(flash[:error]).to eq(:errors_message)
        end
      end
    end
  end

end
