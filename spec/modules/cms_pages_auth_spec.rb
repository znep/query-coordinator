require 'rails_helper'

# stub current_user: http://leeourand.com/2014/02/09/stub-that-object/
# http://stackoverflow.com/questions/24522294/rspec-how-to-stub-inherited-method-current-user-w-o-devise
#
# Testing Modules:
# http://jenstinfors.com/2012/02/02/using-rspec-to-test-modules/
#
# http://blog.pivotal.io/pivotal-labs/labs/testing-modules-that-get-included-in-a-controller

class FakeController < ApplicationController
  include CmsPagesAuth
end

describe CmsPagesAuth do

  # describe FakeController, :type => :controller do
  #   it 'can call current_user' do
  #     good_user_return = {"id"=>"tugg-xxxx", "createdAt"=>1425577015, "displayName"=>"testuser"}
  #     allow( @fakeController ).to receive(:current_user).and_return(good_user_return)
  #     expect( @fakeController.authenticate ).to redirect_to('/login')
  #   end
  # end

  # before do
  #   @fakeController = FakeController.new
  #   # controller.stub(:current_user) { true }
  #   # good_user_return = {"id"=>"tugg-xxxx", "createdAt"=>1425577015, "displayName"=>"testuser"}
  #   # allow(controller).to receive(:core_server_get).and_return(good_user_return)
  #   # ApplicationController.any_instance.stub(:current_user)
  # end

  describe '#authenticate' do

    context 'when logged in' do
      before do
        good_user_return = {"id"=>"tugg-xxxx", "createdAt"=>1425577015, "displayName"=>"testuser"}
        allow( @fakeController ).to receive(:current_user).and_return(good_user_return)
      end

      it 'does not redirect' do
        response = @fakeController.authenticate
        puts response.inspect
        expect( response ).to have_http_status(:ok)
      end
    end

    context 'when not logged in' do

      before do
        allow( @fakeController ).to receive(:current_user).and_return(nil)
      end

      it 'redirects to /login' do
        expect( @fakeController.authenticate ).to redirect_to(location)
      end

      it 'redirects to config.frontend_uri in development mode'

    end

  end

end