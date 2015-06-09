require 'test_helper'

class TestEmptyConfig < ExternalConfig; end
class TestEmptyConfigWithUpdate < ExternalConfig
  def update!; end
end
class TestEmptyConfigWithFilename < ExternalConfig
  def filename; end
end

class TestConfig < ExternalConfig
  def filename; 'does not matter'; end
  def update!; end
end

class ExternalConfigTest < Test::Unit::TestCase

  def test_config_requires_overriding_subclass_methods
    assert_raises(NotImplementedError) { TestEmptyConfig.new }
    assert_raises(NotImplementedError) { TestEmptyConfigWithUpdate.new.filename }
    assert_raises(NotImplementedError) { TestEmptyConfigWithFilename.new }
  end

  def test_config_updates_when_file_touched
    @test_config = TestConfig.new
    @test_config.instance_variable_set :@last_updated, Time.now-1
    File.stubs(:mtime => Time.now)
    assert @test_config.has_changed?
  end

  def test_config_updates_when_last_updated_is_nil
    @test_config = TestConfig.new
    File.stubs(:mtime => Time.now)
    assert @test_config.has_changed?
  end

  def test_config_updates_when_file_does_not_exist
    @test_config = TestConfig.new
    File.stubs(:mtime).raises(Errno::ENOENT)
    refute @test_config.has_changed?
  end

  def test_config_acquired_dynamically
    assert ExternalConfig.for(:test).present?
    assert_raises(NameError) { ExternalConfig.for(:does_not_exist) }
  end

  def test_uniqId_works_properly
    assert ExternalConfig.for(:test).is_a?(TestConfig)
    assert TestConfig.new.uniqId == :test
  end
end
