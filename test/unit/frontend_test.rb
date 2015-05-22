require 'test_helper'

class FrontendTest < Test::Unit::TestCase
  def test_responds_to_version
    assert Frontend.respond_to?(:version)
  end

  def test_version_returns_formatted_string
    assert_match /^\d+\.\d+\.\d+$/, Frontend.version
  end
end
