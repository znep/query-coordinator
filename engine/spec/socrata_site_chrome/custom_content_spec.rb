require 'rails_helper'
require 'webmock/rspec'

describe SocrataSiteChrome::CustomContent do

  let(:domain) { 'data.seattle.gov' }
  let(:site_chrome_config_with_custom_content) { File.read('spec/fixtures/custom_content_config.json') }
  let(:helper) { SocrataSiteChrome::CustomContent.new(domain) }
  let(:coreservice_uri) { Rails.application.config_for(:config)['coreservice_uri'] }
  let(:configurations_uri) { "#{coreservice_uri}/configurations.json?type=site_chrome&defaultOnly=true" }
  let(:domains_uri) { "#{coreservice_uri}/domains/#{domain}.json" }

  describe '#fetch' do
    it 'returns empty content if the config is empty' do
      stub_domains
      stub_configurations(:status => 200, :body => nil)
      expect(helper.fetch).to eq(
        :header => { :html => nil, :css => nil, :js => nil },
        :footer => { :html => nil, :css => nil, :js => nil }
      )
    end

    it 'returns content for each corresponding section from the config' do
      stub_domains
      stub_configurations(:status => 200, :body => site_chrome_config_with_custom_content)
      result = helper.fetch

      expect(result.dig(:header, :html)).to eq('<div id="nyc-custom-header">my custom header</div>')
      expect(result.dig(:header, :css)).to eq('#nyc-custom-header { color: red; }')
      expect(result.dig(:header, :js)).to eq('(function() { console.log(\'nyc is neat\'); } )();')
      expect(result.dig(:footer, :html)).to eq('<div id="nyc-custom-footer">my custom footer</div>')
      expect(result.dig(:footer, :css)).to eq(nil)
      expect(result.dig(:footer, :js)).to eq(nil)
    end

    it 'returns draft content' do
      stub_domains
      stub_configurations(:status => 200, :body => site_chrome_config_with_custom_content)
      result = helper.fetch(:draft)

      expect(result.dig(:header, :html)).to eq(nil)
      expect(result.dig(:footer, :html)).to eq('<div id="nyc-custom-footer">my draft custom footer</div>')
    end
  end

  describe '#activated?' do
    it 'returns false if the activation_state property is nil' do
      stub_domains
      stub_configurations(:status => 200, :body => nil)
      expect(helper.activated?).to eq(false)
    end

    it 'returns false if the activation_state is not true' do
      body = JSON.parse(site_chrome_config_with_custom_content).tap do |content|
        content[0]['properties'].detect { |p| p['name'] == 'activation_state' }['value'] = nil
      end
      stub_domains
      stub_configurations(:status => 200, :body => body)
      expect(helper.activated?).to eq(false)
    end

    it 'returns true if activation_state is true' do
      stub_domains
      stub_configurations(:status => 200, :body => site_chrome_config_with_custom_content)
      expect(helper.activated?).to eq(true)
    end
  end

  describe '#get_property_by_name' do
    it 'returns an empty hash if there is not a match for the property name in the config' do
      stub_configurations(:status => 200, :body => site_chrome_config_with_custom_content)
      result = helper.send(:get_property_by_name, 'wrong_name')
      expect(result).to eq({})
    end

    it 'returns the correct property hash for a given property name' do
      stub_configurations(:status => 200, :body => site_chrome_config_with_custom_content)
      result = helper.send(:get_property_by_name, 'draft_custom_footer_html')
      expect(result).to eq(
        'name' => 'draft_custom_footer_html',
        'value' => '<div id="nyc-custom-footer">my draft custom footer</div>'
      )
    end
  end

  private

end
