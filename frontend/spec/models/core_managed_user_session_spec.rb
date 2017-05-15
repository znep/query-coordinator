
require 'rails_helper'

describe CoreManagedUserSession do
  include TestHelperMethods

  let(:request) { ActionController::TestRequest.new(:host => 'localhost') }

  before do
    init_current_domain
    @controller = ApplicationController.new
    @controller.request = request
    CoreManagedUserSession.controller = @controller
  end

  describe 'save' do
    let(:creds) do
      {
        'login' => 'joe@shmo.com',
        'password' => 'password'
      }
    end

    subject { CoreManagedUserSession.new(creds) }

    it 'should not raise' do
      VCR.use_cassette('user_session_model/authenticate_with_core') do
        expect { subject.save }.to_not raise_error
      end
    end

    it 'should authenticate with core and update the session cookies' do
      VCR.use_cassette('user_session_model/authenticate_with_core') do
        subject.save
      end
    end
  end

  describe 'find' do
    let(:creds) { {:login => 'test@socrata.com', :password => '12345678'} }

    it 'should set current_user ' do
      session = CoreManagedUserSession.new(creds)

      VCR.use_cassette('user_session_model/find_user') do
        session.save()
        newSession = CoreManagedUserSession.find
        expect(newSession).not_to eq(session)
      end

      expect(User.current_user).to_not be(nil)
    end
  end
end
