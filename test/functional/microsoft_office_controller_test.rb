require 'test_helper'

class MicrosoftOfficeControllerTest < ActionController::TestCase
  def test_options_for_mopd
    get :options_for_mopd, {}, :REQUEST_METHOD => 'OPTIONS'
    assert_response :success
  end
end

