require 'rails_helper'

describe SocrataSiteChrome::SiteChrome do
  let(:id) { 2663 }
  let(:updated_at) { '123546789' }
  let(:domain_cname) { 'data.bobloblawslawblog.com' }
  let(:site_chrome_config_vars) { JSON.parse(File.read('spec/fixtures/site_chrome_config_vars.json')).with_indifferent_access }

  let(:site_chrome_config) do
    {
      id: id,
      content: site_chrome_config_vars['content'],
      updated_at: updated_at
    }
  end

  let(:helper) { SocrataSiteChrome::SiteChrome.new(site_chrome_config) }

  it 'does not raise on initialization without parameters' do
    expect { SocrataSiteChrome::SiteChrome.new() }.to_not raise_error
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
      first['properties'].first.dig('value', 'versions', '0.1', 'published', 'content', 'locales').with_indifferent_access }

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

  describe '#default_content' do
    it 'finds the latest default content and has necessary keys' do
      content = helper.send(:default_content)
      expect(content[:general]).not_to be_nil
      expect(content[:header]).not_to be_nil
      expect(content[:footer]).not_to be_nil
      expect(content[:locales]).not_to be_nil
    end
  end
end
