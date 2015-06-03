require 'rails_helper'

RSpec.describe ApplicationController, :type => :controller do
  controller do
    def test_action
      render :text => 'content text', :status => 200
    end
  end

  before do
    routes.draw { get 'test_action' => 'anonymous#test_action' }
  end

  describe '#current_user'

  describe 'require_logged_in_user' do
    context 'with a logged in user' do
      it 'should render the page' do
        stub_logged_in
        get :test_action
        expect(response).to have_http_status(200)
      end
    end

    context 'with no logged in user' do
      it 'should redirect to a login page with the correct return_to query param' do
        get :test_action
        expect(response).to redirect_to("/login?return_to=/stories/test_action")
      end
    end

  end

end
