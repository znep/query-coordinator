require 'rails_helper'

describe SocrataSiteChrome::SiteChrome do
  let(:id) { 2663 }
  let(:updated_at) { '123546789' }
  let(:domain_cname) { 'data.bobloblawslawblog.com' }
  let(:site_chrome_config_vars) { JSON.parse(File.read('spec/fixtures/site_chrome_config.json')).with_indifferent_access['properties'].first['value']['versions']['0.3']['published'] }

  let(:site_chrome_config) do
    {
      id: id,
      content: site_chrome_config_vars['content'],
      updated_at: updated_at
    }
  end

  let(:helper) { SocrataSiteChrome::SiteChrome.new(site_chrome_config) }

  def helper_with_specific_version(version)
    version_specific_content = JSON.parse(File.read('spec/fixtures/site_chrome_config.json')).
      with_indifferent_access['properties'].first['value']['versions'][version]['published']['content']
    SocrataSiteChrome::SiteChrome.new(
      id: id,
      content: version_specific_content,
      updated_at: updated_at,
      current_version: version
    )
  end

  it 'does not raise on initialization without parameters' do
    expect { SocrataSiteChrome::SiteChrome.new }.to_not raise_error
  end

  it 'sets id from properties' do
    expect(helper.id).to eq(id)
  end

  it 'sets content from properties' do
    expect(helper.content).to eq(site_chrome_config_vars['content'])
  end

  it 'sets updated_at from properties' do
    expect(helper.updated_at).to eq(updated_at)
  end

  describe '#locales' do
    let(:default_locales) { JSON.parse(File.read("#{Rails.root}/engine/config/default_site_chrome.json")).
      first['properties'].first.dig('value', 'versions', helper.current_version, 'published', 'content', 'locales').with_indifferent_access }

    it 'uses the default locales if there are no user specified locales' do
      config_vars_without_locales = site_chrome_config_vars['content'].dup.tap do |config_vars|
        config_vars[:locales] = nil
      end
      chrome = SocrataSiteChrome::SiteChrome.new(id: id, content: config_vars_without_locales, updated_at: updated_at)
      expect(chrome.locales).to eq(default_locales)
    end

    it 'deep merges the user locales onto the default locales' do
      config_vars_with_custom_locales = site_chrome_config_vars['content'].dup
      config_vars_with_custom_locales[:locales][:en][:header][:logo_alt] = 'Batman'
      chrome = SocrataSiteChrome::SiteChrome.new(id: id, content: config_vars_with_custom_locales, updated_at: updated_at)
      expect(chrome.locales).not_to eq(default_locales)
      expect(chrome.locales.dig(:en, :header, :logo_alt)).to eq('Batman')
    end
  end

  describe '#default_site_chrome_content' do
    it 'finds the latest default content and has necessary keys' do
      content = helper.send(:default_site_chrome_content)
      expect(content[:general]).not_to be_nil
      expect(content[:header]).not_to be_nil
      expect(content[:footer]).not_to be_nil
      expect(content[:locales]).not_to be_nil
    end

    it 'returns version-specific content' do
      v1_helper = helper_with_specific_version('0.1')
      v1_content = v1_helper.send(:default_site_chrome_content)
      expect(v1_content[:locales][:en][:general]).to have_key(:site_name)
      v2_helper = helper_with_specific_version('0.2')
      v2_content = v2_helper.send(:default_site_chrome_content)
      expect(v2_content[:locales][:en][:header]).to have_key(:site_name)
      expect(v2_content[:locales][:en][:footer]).to have_key(:site_name)
    end
  end
end
