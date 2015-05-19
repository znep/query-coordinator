require 'rails_helper'

describe ApplicationController do

  describe '#current_user' do

    context 'when the user has no session id' do
      it 'returns nil' do
        request.cookies.clear
        expect(controller.current_user).to eq(nil)
      end

      it 'does not call core' do
        request.cookies.clear
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

      it 'returns the user object' do
        # TODO: wtf is this even testing?
        # Stub out Auth object
        auth = double()
        allow(Core::Auth::Client).to receive(:new).and_return(auth)
        good_user_object = {"id"=>"tugg-xxxx", "createdAt"=>1425577015, "displayName"=>"testuser"}
        allow(auth).to receive(:logged_in?).and_return(true)
        allow(auth).to receive(:current_user).and_return(good_user_object)

        # Set cookie so we make an auth object
        request.cookies[:_core_session_id] = "we_have_a_valid_session_id"

        user_actual = controller.current_user
        expect(user_actual).to include('id')
        expect(user_actual).to include('displayName')
      end
    end

  end  #end user logged in context

end
