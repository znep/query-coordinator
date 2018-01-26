require 'rails_helper'

describe ApplicationHelper do
  include TestHelperMethods

  before do
    init_current_domain
    init_feature_flag_signaller
  end

  describe 'render_asset_browser_server_config' do
    it 'should render server config with a test airbrakeEnvironment' do
      result = helper.render_asset_browser_server_config
      expect(result).to match("window.serverConfig = {\"airbrakeEnvironment\":\"test\"")
    end
  end
end
