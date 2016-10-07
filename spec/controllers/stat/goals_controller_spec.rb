require 'rails_helper'

RSpec.describe Stat::GoalsController, type: :controller do
  let(:dashboard) { 'dash-bord' }
  let(:category) { 'cate-gory' }
  let(:uid) { 'test-test' }

  before do
    stub_logged_in_user
  end

  describe '#show' do
    it 'redirects to "classic view" for goal routes' do
      get :show, dashboard: dashboard , category: category , uid: uid
      expect(response).to redirect_to "/stat/goals/#{dashboard}/#{category}/#{uid}/view"
    end
  end
end
