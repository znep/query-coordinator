require 'rails_helper'

RSpec.describe SocrataSiteChrome::ThemesController, type: :controller do

  let(:domain) { 'data.seattle.gov' }

  let(:site_chrome_config_vars) do
    JSON.parse(File.read('spec/fixtures/site_chrome_config_vars.json')).with_indifferent_access
  end

  let(:core_config) do
    JSON.parse(File.read('spec/fixtures/core_config.json')).with_indifferent_access.tap do |config|
      config['properties'].first['value']['versions']['0.1']['published'] = site_chrome_config_vars
    end
  end

  def stub_domain_config
    allow_any_instance_of(SocrataSiteChrome::DomainConfig).to receive(:get_domain_config).and_return(core_config)
  end

  describe 'GET custom' do

    routes { SocrataSiteChrome::Engine.routes }

    it 'renders the custom template' do
      stub_domain_config
      get 'custom', :format => :css
      expect(response).to render_template('custom')
      assert_template 'custom'
      assert_template layout: nil
    end

  end

end
