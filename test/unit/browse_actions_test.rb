require 'test_helper'

class BrowseActionsTest < Test::Unit::TestCase
  describe 'browse_actions module' do
    # Outer describe block to allow module inclusion without polluting
    # entire test environment
    include BrowseActions

    # Test building of the catalog links
    describe 'view_types_facet' do

      def test_does_not_add_stories_if_feature_flag_false
        init_current_domain
        CurrentDomain.stubs(property: nil)
        stub_feature_flags_with(:enable_stories, false)
        view_types_list = view_types_facet
        assert(view_types_list[:options].none? { |link_item| link_item[:value] == 'story'})
      end

      def test_does_add_stories_if_feature_flag_true
        init_current_domain
        CurrentDomain.stubs(property: nil)
        stub_feature_flags_with(:enable_stories, true)
        view_types_list = view_types_facet
        assert(view_types_list[:options].any? { |link_item| link_item[:value] == 'story'})
      end

    end

  end

end
