require 'rails_helper'

RSpec.describe SiteChrome, type: :model do

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

  let(:subject) { SiteChrome.new(site_chrome_config) }

  it 'does not raise on initialization without parameters' do
    expect { SiteChrome.new() }.to_not raise_error
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

  describe '#from_core_config' do
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

    let(:subject) { SiteChrome.from_core_config(core_config) }

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
        expect(subject).to be_a(SiteChrome)
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

 describe '#save' do
    let(:sample_core_config) { JSON.parse(fixture('site_chrome_config.json').read).first }

    context 'when site_chrome is new' do
      let(:site_chrome_config) do
        {
          'styles' => site_chrome_config_vars['styles'],
          'content' => site_chrome_config_vars['content'],
          'domain_cname' => domain_cname
        }
      end

      it 'calls create_or_update_configuration with core' do
        expect(CoreServer).to receive(:create_or_update_configuration).and_return(sample_core_config)
        subject.save
      end

      context 'when successful' do
        before do
          allow(CoreServer).to receive(:create_or_update_configuration).and_return(sample_core_config)
          subject.save
        end

        it 'sets id from response' do
          expect(subject.id).to eq(sample_core_config['id'])
        end

        it 'sets updated_at from response' do
          expect(subject.updated_at).to eq(sample_core_config['updatedAt'])
        end

        it 'sets persisted to true' do
          expect(subject).to be_persisted
        end
      end

      context 'when CoreServer error' do
        let(:error_message) { 'This is an error message' }
        let(:error_response) do
          {
            'error' => true,
            'message' => error_message
          }
        end

        before do
          allow(CoreServer).to receive(:create_or_update_configuration).and_return(error_response)
          subject.save
        end

        it 'sets errors attribute' do
          expect(subject.errors[:base]).to eq([error_message])
        end

        it 'leaves persisted as false' do
          expect(subject).to_not be_persisted
        end

        context 'when previously persisted' do
          let(:persisted) { true }

          it 'sets persisted to false' do
            expect(subject).to_not be_persisted
          end
        end
      end
    end

    context 'when site_chrome exists' do
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

      it 'calls create_or_update_configuration with core' do
        expect(CoreServer).to receive(:create_or_update_configuration).and_return(sample_core_config)
        subject.save
      end
    end

    context 'when site_chrome is invalid' do
      before do
        allow(subject).to receive(:valid?).and_return(false)
      end

      it 'returns false' do
        expect(subject.save).to eq(false)
      end

      it 'leaves persisted as false' do
        expect(subject).to_not be_persisted
      end
    end
  end

  describe '#update_attributes' do
    let(:attributes) do
      {
        'styles' => site_chrome_config_vars['styles'].merge('newVar' => '1px'),
        'content' => site_chrome_config_vars['content'].merge('newContentVar' => 'some text')
      }
    end

    before do
      allow(subject).to receive(:save).and_return(:saved)
    end

    it 'calls save' do
      expect(subject).to receive(:save)
      subject.update_attributes(attributes)
    end

    it 'returns result of save' do
      expect(subject.update_attributes(attributes)).to eq(:saved)
    end

    it 'updates styles' do
      subject.update_attributes(attributes)
      expect(subject.styles).to eq(site_chrome_config_vars['styles'].merge('newVar' => '1px'))
    end

    it 'updates content' do
      subject.update_attributes(attributes)
      expect(subject.content).to eq(site_chrome_config_vars['content'].merge('newContentVar' => 'some text'))
    end
  end

  describe '#for_current_domain' do
    let(:subject) { SiteChrome.for_current_domain }
    let(:site_chrome) { [] }

    before do
      allow(CoreServer).to receive(:site_chrome).and_return(site_chrome)
      allow(CoreServer).to receive(:current_domain).and_return(JSON.parse(fixture('domain.json').read))
    end

    context 'when no config' do
      let(:site_chrome) { [] }

      it 'returns new SiteChrome' do
        expect(subject).to be_a(SiteChrome)
      end

      it 'is not persisted' do
        expect(subject).to_not be_persisted
      end

      it 'merges default styles' do
        expect(subject.styles).to eq(SiteChrome.default_values['styles'])
      end

      it 'merges default content' do
        expect(subject.content).to eq(SiteChrome.default_values['content'])
      end
    end

    context 'when site_chrome config exists' do
      let(:site_chrome) { JSON.parse(fixture('site_chrome_config.json').read) }

      it 'returns a SiteChrome object' do
        expect(subject).to be_a(SiteChrome)
      end

      it 'does not override config with default styles' do
        expect(subject.styles['$bg-color']).to_not eq(SiteChrome.default_values['styles']['$bg-color'])
      end

      it 'does not override config with default content' do
        expect(subject.content['friendlySiteName']).to_not eq(SiteChrome.default_values['content']['friendlySiteName'])
      end
    end
  end
end
