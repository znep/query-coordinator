require 'rails_helper'

describe OdysseusController do
  include TestHelperMethods

  let(:dashboard_id) { 'dash-dash' }
  let(:category_id) { 'cate-gory' }
  let(:goal_id) { 'goal-goal' }

  let(:canonical_view_path) { "/stat/goals/#{dashboard_id}/#{category_id}/#{goal_id}" }
  let(:canonical_edit_path) { "/stat/goals/#{dashboard_id}/#{category_id}/#{goal_id}/edit" }
  let(:classic_view_path) { "/stat/goals/#{dashboard_id}/#{category_id}/#{goal_id}/view" }
  let(:classic_edit_path) { "/stat/goals/#{dashboard_id}/#{category_id}/#{goal_id}/edit-classic" }

  let(:canonical_single_view_path) { "/stat/goals/single/#{goal_id}" }
  let(:canonical_single_edit_path) { "/stat/goals/single/#{goal_id}/edit" }
  let(:classic_single_view_path) { "/stat/goals/single/#{goal_id}/view" }
  let(:classic_single_edit_path) { "/stat/goals/single/#{goal_id}/edit-classic" }

  before(:each) do
    init_anonymous_environment
    # Prevent a config request from being made
    allow(subject).to receive(:enable_site_chrome?).and_return(false)
    allow(CurrentDomain).to receive(:cname).and_return('localhost')
    allow(APP_CONFIG).to receive(:storyteller_uri).and_return('http://odysseus-test:3010')

    allow(subject).to receive(:render_odysseus_path)
  end

  context 'when govstat module is enabled' do
    before do
      allow(CurrentDomain).to receive(:module_enabled?).with('govStat').and_return(true)
    end

    describe 'get #index' do
      it 'renders path on odysseus' do
        allow(subject).to receive(:render_odysseus_path) do |path, options|
          expect(options).to be_nil
          expect(path).to eq('/stat')
        end
        get :index
      end
    end

    describe 'get #preview' do
      it 'renders path on odysseus with suppress_govstat set' do
        allow(subject).to receive(:render_odysseus_path) do |path, options|
          expect(options).to be_nil
          expect(path).to eq('/stat/goals/dash-cash/preview')
          expect(assigns(:suppress_govstat)).to be true
        end

        get :dashboard_preview, :dashboard_id => 'dash-cash'
      end
    end

    describe 'goal-related routes' do
      describe 'get #classic_single_goal' do
        context 'goal has no published narrative in storyteller' do
          it 'renders path on odysseus' do
            VCR.use_cassette('odysseus_controller/no_published_story') do
              expect(subject).to receive(:render_odysseus_path) do |path, options|
                expect(options).to be_nil
                expect(path).to eq(classic_single_view_path)
              end
              get :classic_single_goal, :goal_id => goal_id
            end
          end
        end
        context 'goal has published narrative in storyteller' do
          it 'redirects to the canonical view url' do
            VCR.use_cassette('odysseus_controller/has_published_story') do
              expect(subject).to_not receive(:render_odysseus_path)
              get :classic_single_goal, :goal_id => goal_id
              expect(subject).to redirect_to(canonical_single_view_path)
            end
          end
        end
        context 'goal narrative is private and user is logged out' do
          it 'redirects to login' do
            VCR.use_cassette('odysseus_controller/has_private_story') do
              expect(subject).to_not receive(:render_odysseus_path)
              get :classic_single_goal, :goal_id => goal_id
              expect(subject).to redirect_to(login_url)
            end
          end
        end
        context 'error talking to storyteller' do
          it 'errors' do
            VCR.use_cassette('odysseus_controller/storyteller_500') do
              expect(subject).to_not receive(:render_odysseus_path)
              expect do
                get :classic_single_goal, :goal_id => goal_id
              end.to raise_error(RuntimeError)
            end
          end
        end
      end

      describe 'get #classic_goal' do
        context 'goal has no published narrative in storyteller' do
          it 'renders path on odysseus' do
            VCR.use_cassette('odysseus_controller/no_published_story') do
              expect(subject).to receive(:render_odysseus_path) do |path, options|
                expect(options).to be_nil
                expect(path).to eq(classic_view_path)
              end
              get :classic_goal, :dashboard_id => dashboard_id, :category_id => category_id, :goal_id => goal_id
            end
          end
        end
        context 'goal has published narrative in storyteller' do
          it 'redirects to the canonical view url' do
            VCR.use_cassette('odysseus_controller/has_published_story') do
              expect(subject).to_not receive(:render_odysseus_path)
              get :classic_goal, :dashboard_id => dashboard_id, :category_id => category_id, :goal_id => goal_id
              expect(subject).to redirect_to(canonical_view_path)
            end
          end
        end
        context 'goal narrative is private and user is logged out' do
          it 'redirects to login' do
            VCR.use_cassette('odysseus_controller/has_private_story') do
              expect(subject).to_not receive(:render_odysseus_path)
              get :classic_goal, :dashboard_id => dashboard_id, :category_id => category_id, :goal_id => goal_id
              expect(subject).to redirect_to(login_url)
            end
          end
        end
        context 'error talking to storyteller' do
          it 'errors' do
            VCR.use_cassette('odysseus_controller/storyteller_500') do
              expect(subject).to_not receive(:render_odysseus_path)
              expect do
                get :classic_goal, :dashboard_id => dashboard_id, :category_id => category_id, :goal_id => goal_id
              end.to raise_error(RuntimeError)
            end
          end
        end
      end

      describe 'get #classic_goal_edit' do
        before do
          stub_feature_flags_with(:open_performance_narrative_editor => flag_value)
        end
        context 'open_performance_narrative_editor is set to classic' do
          let(:flag_value) { 'classic' }

          it 'renders path on odysseus' do
            expect(subject).to receive(:render_odysseus_path) do |path, options|
              expect(options).to be_nil
              expect(path).to eq(classic_edit_path)
            end
            get :classic_goal_edit, :dashboard_id => dashboard_id, :category_id => category_id, :goal_id => goal_id
          end
        end

        context 'open_performance_narrative_editor is set to storyteller' do
          let(:flag_value) { 'storyteller' }

          it 'redirects to the canonical view url' do
            expect(subject).to_not receive(:render_odysseus_path)
            get :classic_goal_edit, :dashboard_id => dashboard_id, :category_id => category_id, :goal_id => goal_id
            expect(subject).to redirect_to(canonical_edit_path)
          end
        end
      end

      describe 'get #classic_single_goal_edit' do
        before do
          stub_feature_flags_with(:open_performance_narrative_editor => flag_value)
        end
        context 'open_performance_narrative_editor is set to classic' do
          let(:flag_value) { 'classic' }

          it 'renders path on odysseus' do
            expect(subject).to receive(:render_odysseus_path) do |path, options|
              expect(options).to be_nil
              expect(path).to eq(classic_single_edit_path)
            end
            get :classic_single_goal_edit, :goal_id => goal_id
          end
        end

        context 'open_performance_narrative_editor is set to storyteller' do
          let(:flag_value) { 'storyteller' }

          it 'redirects to the canonical view url' do
            expect(subject).to_not receive(:render_odysseus_path)
            get :classic_single_goal_edit, :goal_id => goal_id
            expect(subject).to redirect_to(canonical_single_edit_path)
          end
        end
      end
    end
  end

  context 'when govstat module is disabled' do
    before do
      allow(CurrentDomain).to receive(:module_enabled?).with('govStat').and_return(false)
    end

    it 'renders a 404 for #index' do
      get :index
      expect(response).to have_http_status(404)
    end

    it 'renders a 404 for #classic_goal' do
      get :classic_goal, :dashboard_id => dashboard_id, :category_id => category_id, :goal_id => goal_id
      expect(response).to have_http_status(404)
    end

    it 'renders a 404 for #classic_single_goal' do
      get :classic_single_goal, :goal_id => goal_id
      expect(response).to have_http_status(404)
    end

    it 'renders a 404 for #classic_goal_edit' do
      get :classic_goal_edit, :dashboard_id => dashboard_id, :category_id => category_id, :goal_id => goal_id
      expect(response).to have_http_status(404)
    end

    it 'renders a 404 for #classic_single_goal_edit' do
      get :classic_single_goal_edit, :goal_id => goal_id
      expect(response).to have_http_status(404)
    end

    it 'renders a 404 for #dashboard_preview' do
      get :dashboard_preview, :dashboard_id => 'dash-cash'
      expect(response).to have_http_status(404)
    end

    it 'renders a 404 for #chromeless' do
      get :chromeless, :goal_id => goal_id
      expect(response).to have_http_status(404)
    end

    it 'renders a 404 for #version' do
      get :version
      expect(response).to have_http_status(404)
    end
  end
end
