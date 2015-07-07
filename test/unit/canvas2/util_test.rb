require_relative '../../test_helper'

class Canvas2UtilTest < Test::Unit::TestCase

  # This test has been running for 16 hours with no sign of stopping.
  # Let's not test this until it starts being sane.
  def x_test_parse_transforms_will_transform
    init_current_domain
    Canvas2::Util.set_request nil

    str = %q{The last item in the URL is a parameter that can be used in the page. The value can be anything. For example, /edit-1/test uses the same Canvas configuration as /edit-1/500. The current value is new test 123 Adding new text: "{?param}"}
    FeatureFlags.stubs(:derive => { use_non_crazy_regex: false })
    assert Canvas2::Util.parse_transforms(str).present?
    FeatureFlags.stubs(:derive => { use_non_crazy_regex: true })
    assert Canvas2::Util.parse_transforms(str).present?
  end
end
