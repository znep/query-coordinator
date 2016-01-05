require 'rails_helper'

RSpec.describe Theme, type: :model do

  let(:id) { 8383 }
  let(:title) { 'Custom Configuration for Example.com' }
  let(:description) { 'Description for custom theme.' }
  let(:google_font_code) { "<link href='https://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>" }
  let(:updated_at) { '123546789' }
  let(:domain_cname) { 'data.bobloblawslawblog.com' }
  let(:persisted) { nil }

  let(:theme_css_vars) do
    {
      '$ms-ratio-1' => '1.1',
      '$ms-ratio-2' => '2.22',
      '$ms-ratio-3' => '3.333',
      '$ms-ratio-4' => '4.4444',
      '$base-type-size' => '101em',
      '$base-line-height' => '$ms-ratio-3'
    }
  end

  let(:theme_config) do
    {
      'css_variables' => theme_css_vars,
      'description' => description,
      'id' => id,
      'title' => title,
      'google_font_code' => google_font_code,
      'updated_at' => updated_at,
      'domain_cname' => domain_cname,
      'persisted' => persisted
    }
  end

  let(:subject) { Theme.new(theme_config) }

  it 'does not raise on initialization without parameters' do
    expect { Theme.new() }.to_not raise_error
  end

  it 'sets id from properties' do
    expect(subject.id).to eq(id)
  end

  it 'sets title from properties' do
    expect(subject.title).to eq(title)
  end

  it 'sets google_font_code from properties' do
    expect(subject.google_font_code).to eq(google_font_code)
  end

  it 'sets description from properties' do
    expect(subject.description).to eq(description)
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

  describe '#css_variables' do
    it 'is set from config' do
      expect(subject.css_variables).to eq(theme_css_vars)
    end
  end

  describe '#class_name' do
    it 'returns id from config' do
      expect(subject.class_name).to eq("custom-#{id}")
    end
  end

  describe '#valid?' do
    context 'when google_font_code is valid' do

      it 'does not set error message' do
        expect(subject).to be_valid
        expect(subject.errors[:google_font_code]).to be_blank
      end
    end

    context 'when google_font_code error' do
      let(:google_font_code) { 'Wrong' }

      it 'sets error message' do
        expect(subject).to_not be_valid
        expect(subject.errors[:google_font_code]).to eq(['is invalid'])
      end

    end
  end

  describe '#save' do
    let(:sample_core_config) { JSON.parse(fixture('story_theme.json').read).first }

    context 'when theme is new' do
      let(:theme_config) do
        {
          'css_variables' => theme_css_vars,
          'description' => description,
          'title' => title,
          'google_font_code' => google_font_code,
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

    context 'when theme exists' do
      let(:theme_config) do
        {
          'css_variables' => theme_css_vars,
          'description' => description,
          'id' => id,
          'title' => title,
          'google_font_code' => google_font_code,
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

    context 'when theme is invalid' do
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
        'css_variables' => theme_css_vars.merge('$newCssVar' => '1px'),
        'description' => 'updated description',
        'title' => 'updated title',
        'google_font_code' => "<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>"
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

    it 'updates title' do
      subject.update_attributes(attributes)
      expect(subject.title).to eq('updated title')
    end

    it 'updates description' do
      subject.update_attributes(attributes)
      expect(subject.description).to eq('updated description')
    end

    it 'updates css_variables' do
      subject.update_attributes(attributes)
      expect(subject.css_variables).to eq(theme_css_vars.merge('$newCssVar' => '1px'))
    end

    it 'updates google_font_code' do
      subject.update_attributes(attributes)
      expect(subject.google_font_code).to eq("<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>")
    end
  end

  describe '#destroy' do
    it 'calls delete_configuration on core server' do
      expect(CoreServer).to receive(:delete_configuration).with(subject.id)
      subject.destroy
    end
  end

  describe '#find' do
    let(:subject) { Theme.find(id) }

    context 'when config not found' do
      before do
        allow(CoreServer).to receive(:get_configuration).with(id).and_return(nil)
      end

      it 'raises' do
        expect { subject }.to raise_error(/Could not find theme configuration with id, #{id}./)
      end
    end

    context 'when config found' do
      let(:story_json) { JSON.parse(fixture('story_theme.json').read).first }
      let(:id) { story_json['id'] }

      before do
        allow(CoreServer).to receive(:get_configuration).with(id).and_return(story_json)
      end

      it 'returns theme object' do
        expect(subject).to be_a(Theme)
      end

      it 'theme is initialized' do
        expect(subject.id).to eq(id)
      end
    end
  end

  describe '#for_theme_list_config' do
    it 'returns a hash with properties' do
      expected = {
        'description' => description,
        'id' => "custom-#{id}",
        'title' => title
      }
      expect(subject.for_theme_list_config).to eq(expected)
    end
  end

  describe '#from_core_config' do
    let(:core_config) do
      {
        'default' => true,
        'domainCName' => domain_cname,
        'id' => id,
        'name' => 'Story Theme 1',
        'updatedAt' => updated_at,
        'properties' => [
          { 'name' => 'title', 'value' => title },
          { 'name' => 'description', 'value' => description },
          { 'name' => 'css_variables', 'value' => theme_css_vars },
          { 'name' => 'google_font_code', 'value' => google_font_code }
        ],
        'type' => 'story_theme'
      }
    end

    let(:subject) { Theme.from_core_config(core_config) }

    it 'sets id from properties' do
      expect(subject.id).to eq(id)
    end

    it 'sets title from properties' do
      expect(subject.title).to eq(title)
    end

    it 'sets description from properties' do
      expect(subject.description).to eq(description)
    end

    it 'sets google_font_code from properties' do
      expect(subject.google_font_code).to eq(google_font_code)
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

    context 'when core config properties does not exist' do
      let(:core_config) do
        {
          'default' => true,
          'domainCName' => domain_cname,
          'id' => 234,
          'name' => 'Story Theme 1',
          'type' => 'story_theme'
        }
      end

      it 'returns nil' do
        expect(subject).to be_nil
      end
    end
  end

  describe '#all_custom_for_current_domain' do
    let(:subject) { Theme.all_custom_for_current_domain }
    let(:custom_themes) { [] }

    before do
      allow(CoreServer).to receive(:story_themes).and_return(custom_themes)
    end

    context 'when no custom themes' do
      let(:custom_themes) { nil }

      it 'returns empty array' do
        expect(subject).to be_a(Array)
        expect(subject).to be_empty
      end
    end

    context 'when one custom theme' do
      let(:custom_themes) { JSON.parse(fixture('story_theme.json').read) }

      it 'returns one theme' do
        expect(subject.size).to eq(1)
      end

      it 'returns a Theme object' do
        expect(subject.first).to be_a(Theme)
      end
    end

    context 'when multiple custom themes' do
      let(:one_theme) { JSON.parse(fixture('story_theme.json').read) }
      let(:two_theme) { JSON.parse(fixture('story_theme.json').read) }
      let(:custom_themes) { one_theme + two_theme }

      it 'returns two themes' do
        expect(subject.size).to eq(2)
      end

      it 'returns different Theme objects' do
        expect(subject.first).to_not equal(subject.second)
      end
    end
  end

end
