require 'rails_helper'

# Create a fake controller to so we can hit authenticate
class FakeController < ApplicationController
  include CmsPagesAuth
  before_action :authenticate

  def test
    head :ok
  end
end

# Set up route for fake controller
Storyteller::Application.routes.draw do
  get 'fake_page/test' => 'fake#test'
end

# Test auth module itself
describe 'CmsPagesAuth', 'included in a' do

  describe FakeController do

    context 'when a user is not logged in' do
      it 'does not allow access to frontend pages' do
        get :test
        expect(response).to redirect_to("/login?return_to=/stories/fake_page/test")
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
