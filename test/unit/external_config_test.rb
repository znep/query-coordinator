require 'test_helper'

class TestConfigWithoutUpdate < ExternalConfig; end

class TestConfig < ExternalConfig
  def update!; end
end

class ExternalConfigTest < Test::Unit::TestCase

  def test_config_requires_overriding_update
    assert_raises(NotImplementedError) do
      TestConfigWithoutUpdate.new(:test_no_update, 'whatever')
    end
  end

  def test_config_updates_when_file_touched
    @test_config = TestConfig.new(:test, "doesn't matter")
    @test_config.instance_variable_set :@last_updated, Time.now-1
    File.stubs(:mtime => Time.now)
    assert @test_config.has_changed?
  end

end
