require 'rails_helper'

RSpec.describe Admin::ThemesController, type: :controller do

  context 'when user is unauthenticated' do
    before do
      stub_invalid_session
    end

    it 'access to #index is forbidden' do
      get :index
      expect(response).to be_forbidden
    end

    it 'access to #new is forbidden' do
      get :new
      expect(response).to be_forbidden
    end

    it 'access to #edit is forbidden' do
      get :edit, id: 1234
      expect(response).to be_forbidden
    end
  end

  context 'when signed-in user is not super admin' do
    before do
      stub_valid_session
    end

    it 'access to #index is forbidden' do
      get :index
      expect(response).to be_forbidden
    end

    it 'access to #new is forbidden' do
      get :new
      expect(response).to be_forbidden
    end

    it 'access to #edit is forbidden' do
      get :edit, id: 1234
      expect(response).to be_forbidden
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
      let(:story_theme) { JSON.parse(fixture('story_theme.json').read).first }
      let(:theme) { Theme.from_core_config(story_theme) }

      before do
        allow(Theme).to receive(:find).with(theme.id.to_s).and_return(theme)
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
      let(:theme_attrs) do
        {
          'title' => 'Some title',
          'description' => 'A description'
        }
      end

      context 'with valid attributes' do
        before do
          expect_any_instance_of(Theme).to receive(:save).and_return(true)
        end

        it 'redirects to index' do
          post :create, theme: theme_attrs
          expect(response).to redirect_to(action: 'index')
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
      end
    end
  end

end
