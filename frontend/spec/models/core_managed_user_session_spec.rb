
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

  describe 'user_no_security_check' do
    let(:user_data) do
      {
        email: 'test1@example.com',
        password: 'Password1!',
        screenName: 'Test Account'
      }
    end

    it 'should set current_user and session cookie' do
      VCR.use_cassette('user_session_model/user_no_security_check') do
        user = User.create(user_data)
        user.password = 'Password1!'

        newSession = CoreManagedUserSession.user_no_security_check(user)
        byebug
        expect(cookie_string).to eq('_core_session_id=4294725782bf5d463f5eff2d3808451bc005c110a5c07ca4d9db2f3e7c1d3755;remember_token=5KI4OwGkG1vrPiNgBgA9lBFbduVUgbNx;Path=/')
      end

      expect(User.current_user).to_not be(nil)
    end

  end
end
