require 'rails_helper'

describe BrowseController do
  include TestHelperMethods

  before(:each) do
    init_core_session
    init_current_domain
  end

  describe 'GET /browse' do
    context 'when domain is not locked down' do
      before(:each) do
        CurrentDomain.stub(:feature?).with(:staging_lockdown) { false }
      end

      context 'when user is not logged in' do
        it 'allows user to see catalog' do
          VCR.use_cassette('browse_controller/not_locked_down') do
            get :show
            expect(response).to be_success
          end
        end
      end

      context 'when user is logged in' do
        it 'allows user to see catalog' do
          VCR.use_cassette('browse_controller/not_locked_down') do
            login
            get :show
            expect(response).to be_success
            logout
          end
        end
      end
    end

    context 'when domain is locked down' do
      before(:each) do
        CurrentDomain.stub(:feature?).with(:staging_lockdown) { true }
      end

      context 'when user is not logged in' do
        it 'redirects user to login when trying to view catalog' do
          VCR.use_cassette('browse_controller/locked_down') do
            get :show
            expect(response).to redirect_to(:login)
            expect(flash[:notice]).to eq('You must be logged in to access this page')
          end
        end
      end

      context 'when user is logged in' do
        it 'allows admin user to see catalog' do
          stub_user
          VCR.use_cassette('browse_controller/locked_down') do
            get :show
            expect(response).to render_template(:show)
            logout
          end
        end
      end
    end

  end

  def stub_user
    user_double = double(User)
    allow(user_double).to receive(:rights).and_return(['some_right'])
    allow_any_instance_of(BrowseController).to receive(:current_user).and_return(user_double)
  end

end
