require 'rails_helper'

describe ExternalConfig do

  class TestEmptyConfig < ExternalConfig; end

  class TestEmptyConfigWithUpdate < ExternalConfig
    def update!; end
  end

  class TestEmptyConfigWithFilename < ExternalConfig
    def filename; end
  end

  class TestConfig < ExternalConfig
    def filename; 'example'; end
    def update!; end
  end

  describe 'required methods' do
    it 'will raise if not implemented' do
      expect { TestEmptyConfig.new }.to raise_error(NotImplementedError)
      expect { TestEmptyConfigWithUpdate.new.filename }.to raise_error(NotImplementedError)
      expect { TestEmptyConfigWithFilename.new }.to raise_error(NotImplementedError)
    end
  end

  describe '#for' do
    it 'gets an instance of the named subclass' do
      config = ExternalConfig.for(:test)
      expect(config).to be_instance_of(TestConfig)
      expect(config.uniqId).to eq(:test)
    end

    it 'raises if the named subclass is unavailable' do
      expect { ExternalConfig.for(:foo) }.to raise_error(NameError)
    end
  end

  describe '#has_changed?' do
    let(:config) { TestConfig.new }

    it 'detects an update when the file did not previously exist' do
      allow(File).to receive(:exists?).and_return(true)
      expect(config.has_changed?).to eq(false)

      allow(File).to receive(:exists?).and_return(false)
      expect(config.has_changed?).to eq(true)
    end

    it 'detects an update when the file is touched' do
      mtime = Time.now
      allow(File).to receive(:mtime).and_return(mtime)
      allow(File).to receive(:exists?).and_return(true)

      config.instance_variable_set(:@last_updated, mtime)
      expect(config.has_changed?).to eq(false)

      config.instance_variable_set(:@last_updated, mtime + 1)
      expect(config.has_changed?).to eq(false)

      config.instance_variable_set(:@last_updated, mtime - 1)
      expect(config.has_changed?).to eq(true)
    end

    it 'detects an update when the config never had a last_updated value' do
      mtime = Time.now
      allow(File).to receive(:mtime).and_return(mtime)
      allow(File).to receive(:exists?).and_return(true)

      expect(config.has_changed?).to eq(true)
    end
  end
end
