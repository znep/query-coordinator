require 'rails_helper'

describe InternalHelper do
  include TestHelperMethods

  before do
    init_current_domain
    init_feature_flag_signaller
    init_current_user(
      ApplicationController.new.tap do |controller|
        session_double = double
        allow(session_double).to receive(:[]=)
        controller.request = ActionDispatch::Request.new(ENV)
        controller.response = ActionDispatch::Response.new
        allow(controller).to receive(:session).and_return(session_double)
      end
    )
  end

  describe 'valid_cname?' do
    it 'returns true when provided with valid cnames' do
      expect(helper.valid_cname?('localhost')).to eq(true)
      expect(helper.valid_cname?('example.com')).to eq(true)
      expect(helper.valid_cname?('data.weatherfordtx.gov')).to eq(true)
      expect(helper.valid_cname?('atf-performance-dashboards.demo.socrata.com')).to eq(true)
    end

    it 'returns false when provided with invalid cnames' do
      expect(helper.valid_cname?('localhost.')).to eq(false)
      expect(helper.valid_cname?('localhost..com')).to eq(false)
      expect(helper.valid_cname?('http://localhost')).to eq(false)
      expect(helper.valid_cname?('local--host')).to eq(false)
      expect(helper.valid_cname?('felixhernandez@demo.socrata.com')).to eq(false)
      expect(helper.valid_cname?('cityofmadison,demo.socrata.com')).to eq(false)
    end
  end
end
