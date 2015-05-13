require 'rails_helper'

describe ApplicationController do

  describe '#current_user' do
    context 'when the user has no session id' do
      it 'returns nil' do
        request.cookies.clear
        expect( controller.current_user ).to eq(nil)
      end

      it 'does not call core' do
        request.cookies.clear
        expect( controller).to_not receive(:core_server_get)
      end
    end

    context 'when the user is not logged in' do
      it 'returns nil' do
        # Set a cookie so we call core
        request.cookies[:_core_session_id] = "we_have_a_session_id"

        # Stub a user_not_found return from core
        bad_user_return = {"code"=>"not_found", "error"=>true, "message"=>"User not found"}
        allow(controller).to receive(:core_server_get).and_return(bad_user_return)

        expect( controller.current_user ).to eq(nil)
      end
    end

    context 'when the user is logged in' do
      it 'returns the user object' do
        request.cookies[:_core_session_id] = "we_have_a_valid_session_id"

        # Stub a user found return from Core
        good_user_return = {"id"=>"tugg-xxxx", "createdAt"=>1425577015, "displayName"=>"testuser"}
        allow(controller).to receive(:core_server_get).and_return(good_user_return)

        user_actual = controller.current_user
        expect( user_actual ).to include('id')
        expect( user_actual ).to include('displayName')
      end
    end

  end

end
