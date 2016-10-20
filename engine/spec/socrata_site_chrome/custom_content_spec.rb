require 'rails_helper'
require 'webmock/rspec'

describe SocrataSiteChrome::CustomContent do

  let(:domain) { 'data.seattle.gov' }
  let(:site_chrome_config_with_custom_content) { File.read('spec/fixtures/custom_content_config.json') }
  let(:site_chrome_config_without_custom_content) { "[#{File.read('spec/fixtures/site_chrome_config.json')}]" }
  let(:helper) { SocrataSiteChrome::CustomContent.new(domain) }
  let(:coreservice_uri) { Rails.application.config_for(:config)['coreservice_uri'] }
  let(:uri) { "#{coreservice_uri}/configurations.json?type=site_chrome&defaultOnly=true" }

  describe '#fetch' do
    it 'returns empty content if the config is empty' do
      stub_configurations(:status => 200, :body => nil)
      expect(helper.fetch).to eq(
        {:header=>{:html=>nil, :css=>nil, :js=>nil}, :footer=>{:html=>nil, :css=>nil, :js=>nil}}
      )
    end

    it 'returns content for each corresponding section from the config' do
      stub_configurations(:status => 200, :body => site_chrome_config_with_custom_content)
      result = helper.fetch

      expect(result.dig(:header, :html)).to eq('<div id="nyc-custom-header">my custom header</div>')
      expect(result.dig(:header, :css)).to eq('#nyc-custom-header { color: red; }')
      expect(result.dig(:header, :js)).to eq('(function() { console.log(\'nyc is neat\'); } )();')
      expect(result.dig(:footer, :html)).to eq('<div id="nyc-custom-footer">my custom footer!</div>')
      expect(result.dig(:footer, :css)).to eq(nil)
      expect(result.dig(:footer, :js)).to eq(nil)
    end
  end

  describe '#present?' do
    it 'returns false if the config response is empty' do
      stub_configurations(:status => 200, :body => nil)
      expect(helper.present?).to eq(false)
    end

    it 'returns false if the config response contains normal site chrome content but no custom content' do
      stub_configurations(:status => 200, :body => site_chrome_config_without_custom_content)
      expect(helper.present?).to eq(false)
    end

    it 'returns true if custom content is present' do
      stub_configurations(:status => 200, :body => site_chrome_config_with_custom_content)
      expect(helper.present?).to eq(true)
    end
  end

  private

  def stub_configurations(response)
    stub_request(:get, uri).to_return(:status => response[:status], :body => response[:body])
  end

end
