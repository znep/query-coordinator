require 'rails_helper'

describe OdysseusController do
  include TestHelperMethods

  before(:each) do
    init_core_session
    init_current_domain
    # Prevent a config request from being made
    allow(subject).to receive(:enable_site_chrome?).and_return(false)
    allow(CurrentDomain).to receive(:cname).and_return('localhost')
    allow(APP_CONFIG).to receive(:storyteller_uri).and_return('http://odysseus-test:3010')

    allow(subject).to receive(:render_odysseus_path)
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

  describe 'goal-related routes' do
    let(:dashboard_id) { 'dash-dash' }
    let(:category_id) { 'cate-cate' }
    let(:goal_id) { 'goal-goal' }

    let(:canonical_view_path) { "/stat/goals/#{dashboard_id}/#{category_id}/#{goal_id}" }
    let(:classic_view_path) { "/stat/goals/#{dashboard_id}/#{category_id}/#{goal_id}/view" }

    let(:canonical_single_view_path) { "/stat/goals/single/#{goal_id}" }
    let(:classic_single_view_path) { "/stat/goals/single/#{goal_id}/view" }

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
            subject.should redirect_to(canonical_single_view_path)
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
            subject.should redirect_to(canonical_view_path)
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
  end
end