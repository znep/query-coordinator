require 'rails_helper'

describe BrowseController do
  include TestHelperMethods

  before(:each) do
    init_anonymous_environment
    rspec_stub_feature_flags_with(cetera_search: true)
    allow(subject).to receive(:enable_site_chrome?).and_return(false)
    allow(CurrentDomain).to receive(:configUpdatedAt).and_return(1477332911)
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
            expect(flash[:notice]).to match(/You must be logged in to access this page/i)
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

    context 'when passed invalid limit param' do
      render_views  # Cause RSpec actually render the view templates

      before do
        bypass_rescue # Prevent the rescue_from behavior of ApplicationController
      end

      context 'when a non-numeric value' do
        it 'raises an invalid request error on show' do
          VCR.use_cassette('browse_controller/catalog') do
            expect do
              get :show, :limit => 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
            end.to raise_error(ApplicationController::BadParametersError)
          end
        end

        it 'raises an invalid reqeust error on embed' do
          VCR.use_cassette('browse_controller/catalog') do
            expect do
              get :embed, :limit => 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
            end.to raise_error(ApplicationController::BadParametersError)
          end
        end
      end

      context 'when an invalid numeric value' do
        it 'raises an invalid request error on show' do
          VCR.use_cassette('browse_controller/catalog') do
            expect do
              get :show, :limit => '0'
            end.to raise_error(ApplicationController::BadParametersError)
          end
        end

        it 'raises an invalid reqeust error on embed' do
          VCR.use_cassette('browse_controller/catalog') do
            expect do
              get :embed, :limit => '0'
            end.to raise_error(ApplicationController::BadParametersError)
          end
        end
      end
    end

    context 'when cetera_search is true' do
      render_views

      before do
        rspec_stub_feature_flags_with(:cetera_search => true)
      end

      it 'should not use browse2 when rendering the asset picker' do
        stub_site_chrome
        VCR.use_cassette('browse_controller/select_dataset') do
          get :select_dataset
          expect(response).to be_success
          assert_select('table.gridList')
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
