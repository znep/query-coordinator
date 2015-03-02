require 'test_helper'

class BrowseActionsTest < Test::Unit::TestCase

  class DummyObject
    include BrowseActions

    def get_view_types_facet
      view_types_facet
    end

  end

  def dummy_object
    @dummy_object ||= DummyObject.new
  end

  def setup
    init_current_domain
    CurrentDomain.stubs(configuration: nil)
  end

  def test_view_types_facet_no_request
    actual_value = nil
    assert_nothing_raised { actual_value = dummy_object.get_view_types_facet }
    assert_not_nil actual_value
  end

end


