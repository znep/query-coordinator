require 'rails_helper'

RSpec.describe ApplicationController do

  describe '#current_user' do
    let(:auth) { double('auth') }

    before do
      allow(Core::Auth::Client).to receive(:new).and_return(auth)
      request.cookies[:_core_session_id] = "we_have_a_session_id"
    end

    it 'calls Core::Auth::Client with params' do
      #stub out core auth calls
      expect(Core::Auth::Client).to receive(:new).with(
        request.host,
        port: nil,
        cookie: '_core_session_id=we_have_a_session_id',
        verify_ssl_cert: false
      ).and_return(auth)
      expect(auth).to receive(:logged_in?).and_return(false)

      # Call that hits the expect/allow above
      controller.current_user
    end

    context 'when the user has no session id' do
      before do
        request.cookies.clear
      end

      it 'returns nil' do
        expect(controller.current_user).to eq(nil)
      end

      it 'does not call core' do
        expect(Core::Auth::Client).to_not receive(:new)
        controller.current_user
      end
    end

    context 'when the user is not logged in' do
      before do
        allow(auth).to receive(:logged_in?).and_return(false)
      end

      it 'returns nil' do
        expect(controller.current_user).to eq(nil)
      end
    end # end user not logged in context


    context 'when the user is logged in' do
      before do
        allow(auth).to receive(:logged_in?).and_return(true)
      end

      it 'returns the user object' do
        user = double('user')
        expect(auth).to receive(:current_user).and_return(user)
        expect(controller.current_user).to equal(user)
      end
    end # end user logged in context
  end # end describe #current_user

end
