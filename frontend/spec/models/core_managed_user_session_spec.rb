
require 'rails_helper'

describe CoreManagedUserSession do
  include TestHelperMethods

  let(:request) { ActionController::TestRequest.new(:host => 'localhost') }

  before do
    init_current_domain
    init_feature_flag_signaller
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

  describe 'find with no existing session' do
    it 'should set current_user to nil ' do
      session = CoreManagedUserSession.find
      expect(session).to be(nil)
      expect(User.current_user).to be(nil)
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
      end

      expect(User.current_user.session_token).to eq('dTNyci1qN3I5IDE0OTUxNjczMDQgMjA5YjQ5NzRmODhiZGYwMzc2ZWVhOTM3YzcwNzNhOGEgYmI2MWM5ZDkxM2JjMmQ3MDkwODg2ZTk0Mjc2Y2FkNzM5NThhNzMyMg')
      expect(User.current_user).to_not be(nil)
    end

  end
end
