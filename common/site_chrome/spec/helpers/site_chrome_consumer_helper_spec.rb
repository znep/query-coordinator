require 'rails_helper'
require ::File.expand_path('../../spec_helper', __FILE__)

describe SiteChromeConsumerHelpers do
  let(:config) { site_chrome_config }

  before do
    stub_current_domain_with('localhost')
  end

  describe '#site_chrome_admin_header' do
    context 'current_user is nil' do
      before do
        allow(helper).to receive(:site_chrome_current_user).and_return(nil)
      end

      it 'does not render the admin_header' do
        expect(helper.site_chrome_admin_header(request = nil, response = nil)).to eq(nil)
      end
    end

    context 'current_user is present' do
      before do
        allow(helper).to receive(:site_chrome_current_user).and_return(SocrataSiteChrome::User.new)
      end

      let(:mock_header) { 'Mock site_chrome_admin_header' }

      let(:mock_site_chrome_instance) { OpenStruct.new }

      it 'renders the admin_header', :verify_stubs => false do
        allow(mock_site_chrome_instance).to receive(:admin_header).and_return(mock_header)
        expect(helper).to receive(:site_chrome_controller_instance).and_return(mock_site_chrome_instance)
        expect(helper.site_chrome_admin_header(request = nil, response = nil)).to eq(mock_header)
      end
    end

  end
end
