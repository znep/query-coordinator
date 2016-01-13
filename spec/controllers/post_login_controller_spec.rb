require 'rails_helper'

RSpec.describe PostLoginController, type: :controller do

  before do
    stub_valid_session
  end

  describe 'google analytics' do
    render_views

    context 'when not configured' do
      it 'does not render google analytics partial' do
        get :show
        expect(response.body).to_not have_content(@google_analytics_tracking_id)
      end
    end

    context 'when configured' do
      before do
        stub_google_analytics
      end

      it 'renders google analytics partial' do
        get :show
        expect(response.body).to have_content(@google_analytics_tracking_id)
      end
    end
  end
end
