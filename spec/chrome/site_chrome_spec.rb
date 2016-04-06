require 'spec_helper'

describe Chrome::SiteChrome do
  let(:id) { 2663 }
  let(:updated_at) { '123546789' }
  let(:domain_cname) { 'data.bobloblawslawblog.com' }
  let(:site_chrome_config_vars) { JSON.parse(File.read('spec/fixtures/site_chrome_config_vars.json')) }
  let(:core_config) do
    JSON.parse(File.read('spec/fixtures/core_config.json')).tap do |config|
      config['properties'].first['value']['versions']['0.1']['published'] = site_chrome_config_vars
    end
  end

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

  describe '#get_content' do
    it 'should raise if nil section is passed' do
      expect { helper.get_content(nil) }.to raise_error('Must provide a section name to render')
    end

    it 'should raise if invalid section is passed' do
      expect { helper.get_content('wrong_section') }.to raise_error(
        'Invalid section name. Must be one of "header", "navigation", or "footer"'
      )
    end
  end

  describe '#init_from_core_config' do
    let(:helper) { Chrome::SiteChrome.init_from_core_config(core_config) }

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

    context 'when core config does not exist' do
      let(:core_config) { {} }

      it 'returns an empty initialized object' do
        expect(helper).to be_a(Chrome::SiteChrome)
        expect(helper.id).to be_nil
        expect(helper.domain_cname).to be_nil
        expect(helper.content).to be_empty
      end
    end

    context 'when core config is nil' do
      let(:core_config) { nil }

      it 'returns nil' do
        expect(helper).to be_nil
      end
    end
  end

  describe '#newest_published_site_chrome' do
    it 'returns an empty hash if core_config does not have properties' do
      result = Chrome::SiteChrome.newest_published_site_chrome({})
      expect(result).to eq({})
    end

    it 'returns the published config of the most recent version of the site chrome' do
      core_config_with_various_versions = core_config.clone
      core_config_with_various_versions['properties'].first['value']['versions'] =
        {
          '0.1' => {
            'draft' => { 'value' => 'x' },
            'published' => { 'value' => 'a' }
          },
          '23.8' => { # Ensure we are sorting by largest number, and not alpha
            'draft' => { 'value' => 'y' },
            'published' => { 'value' => 'b' }
          },
          '8.1' => {
            'draft' => { 'value' => 'z' },
            'published' => { 'value' => 'c' }
          }
        }

      result = Chrome::SiteChrome.newest_published_site_chrome(core_config_with_various_versions)
      expect(result).to eq({ 'value' => 'b' })
    end
  end

end
