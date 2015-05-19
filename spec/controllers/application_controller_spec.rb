require 'rails_helper'

describe ApplicationController do

  describe '#current_user' do

    it 'calls Core::Auth::Client with params' do
      request.cookies[:_core_session_id] = "we_have_a_session_id"

      #stub out core auth calls
      auth = double()
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
      it 'returns nil' do
        request.cookies.clear
        expect(controller.current_user).to eq(nil)
      end

      it 'does not call core' do
        request.cookies.clear
        controller.current_user
        expect(Core::Auth::Client).to_not receive(:new)
      end
    end

    # TODO: test that core auth client gets called

    context 'when the user is not logged in' do

      before do
        auth = double()
        allow(Core::Auth::Client).to receive(:new).and_return(auth)
        allow(auth).to receive(:logged_in?).and_return(false)
      end

      it 'returns nil' do
        # Set a cookie so we make an auth object
        request.cookies[:_core_session_id] = "we_have_a_session_id"
        expect(controller.current_user).to eq(nil)
      end
    end # end user not logged in context


    context 'when the user is logged in' do

      it 'returns the user object'
      # TODO: test this with an integration test
      # Leaving as a pending test to remind us to fix this

    end

  end  #end user logged in context

end
