require 'spec_helper'

describe Chrome::SiteChrome do
  let(:id) { 2663 }
  let(:updated_at) { '123546789' }
  let(:domain_cname) { 'data.bobloblawslawblog.com' }
  let(:persisted) { nil }

  let(:site_chrome_config_vars) do
    {
      'styles' => {
        '$bg-color' => '#abcdef',
        '$font-color' => '#012345'
      },
      'content' => {
        'logoUrl' => 'http://s3.bucket.com/images/001/logo.png',
        'logoAltText' => 'Bob Loblaw\'s Law Blog',
        'friendlySiteName' => 'Bob Loblaw\'s Law Blog'
      }
    }
  end

  let(:site_chrome_config) do
    {
      'id' => id,
      'styles' => site_chrome_config_vars['styles'],
      'content' => site_chrome_config_vars['content'],
      'updated_at' => updated_at,
      'domain_cname' => domain_cname,
      'persisted' => persisted
    }
  end

  let(:subject) { Chrome::SiteChrome.new(site_chrome_config) }

  it 'does not raise on initialization without parameters' do
    expect { Chrome::SiteChrome.new() }.to_not raise_error
  end

  it 'sets id from properties' do
    expect(subject.id).to eq(id)
  end

  it 'sets styles from properties' do
    expect(subject.styles).to eq(site_chrome_config_vars['styles'])
  end

  it 'sets content from properties' do
    expect(subject.content).to eq(site_chrome_config_vars['content'])
  end

  it 'sets updated_at from properties' do
    expect(subject.updated_at).to eq(updated_at)
  end

  it 'sets domain_cname from properties' do
    expect(subject.domain_cname).to eq(domain_cname)
  end

  it 'sets persisted to false by default' do
    expect(subject).to_not be_persisted
  end

  describe '#init_from_core_config' do
    let(:core_config) do
      {
        'default' => true,
        'domainCName' => domain_cname,
        'id' => id,
        'name' => 'Site Chrome',
        'updatedAt' => updated_at,
        'properties' => [
          { 'name' => 'siteChromeConfigVars', 'value' => site_chrome_config_vars }
        ],
        'type' => 'site_chrome'
      }
    end

    let(:subject) { Chrome::SiteChrome.init_from_core_config(core_config) }

    it 'sets id from properties' do
      expect(subject.id).to eq(id)
    end

    it 'sets styles from properties' do
      expect(subject.styles).to eq(site_chrome_config_vars['styles'])
    end

    it 'sets content from properties' do
      expect(subject.content).to eq(site_chrome_config_vars['content'])
    end

    it 'sets updated_at from properties' do
      expect(subject.updated_at).to eq(updated_at)
    end

    it 'sets domain_cname from properties' do
      expect(subject.domain_cname).to eq(domain_cname)
    end

    it 'sets persisted to true' do
      expect(subject).to be_persisted
    end

    context 'when core config does not exist' do
      let(:core_config) { {} }

      it 'returns an empty initialized object' do
        expect(subject).to be_a(Chrome::SiteChrome)
        expect(subject.id).to be_nil
        expect(subject.domain_cname).to be_nil
        expect(subject.styles).to be_empty
        expect(subject.content).to be_empty
        expect(subject).to_not be_persisted
      end
    end

    context 'when core config is nil' do
      let(:core_config) { nil }

      it 'returns nil' do
        expect(subject).to be_nil
      end
    end
  end
end
