require 'rails_helper'

describe Chrome::SiteChrome do
  let(:id) { 2663 }
  let(:updated_at) { '123546789' }
  let(:domain_cname) { 'data.bobloblawslawblog.com' }
  let(:site_chrome_config_vars) { JSON.parse(File.read('spec/fixtures/site_chrome_config_vars.json')).with_indifferent_access }

  let(:site_chrome_config) do
    {
      id: id,
      content: site_chrome_config_vars['content'],
      updated_at: updated_at,
      domain_cname: domain_cname
    }
  end

  let(:helper) { Chrome::SiteChrome.new(site_chrome_config) }

  it 'does not raise on initialization without parameters' do
    expect { Chrome::SiteChrome.new() }.to_not raise_error
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

  it 'sets domain_cname from properties' do
    expect(helper.domain_cname).to eq(domain_cname)
  end
end
