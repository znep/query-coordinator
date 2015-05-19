require 'rails_helper'

# Test auth module itself
describe 'CmsPagesAuth', 'included in a' do

  describe "AnonymousController", type: :controller do
    controller do
      include CmsPagesAuth
      before_action :authenticate

      def test
        head :ok
      end
    end

    before do
      routes.draw { get 'test' => 'anonymous#test' }
    end

    context 'when a user is not logged in' do
      it 'does not allow access to frontend pages' do
        get :test
        expect(response).to redirect_to("/login?return_to=/stories/test")
      end
    end

    context 'when a user is logged in' do
      it 'does allow access to frontend pages' do
        stub_logged_in
        get :test
        expect(response).to have_http_status(200)
      end
    end
  end

end
