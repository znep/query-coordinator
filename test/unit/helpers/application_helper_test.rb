require 'test_helper'

class ApplicationHelperTest < ActionView::TestCase

  def test_render_fullstory_tacking_does_not_render
    FeatureFlags.stubs(:derive => { enable_fullstory_tracking: false })
    refute application_helper.render_fullstory_tracking
  end

  def test_render_fullstory_tracking_does_render
    FeatureFlags.stubs(:derive => { enable_fullstory_tracking: true })
    assert(application_helper.render_fullstory_tracking =~ /fullstory\.com/)
  end

end
