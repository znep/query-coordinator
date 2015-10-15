require 'test_helper'

class BrowseActionsTest < Test::Unit::TestCase
  class BrowseActionsContainer
    include BrowseActions
  end

  # Test building of the catalog links
  describe 'view_types_facet' do
    def setup
      @browse_actions_container = BrowseActionsContainer.new
      init_current_domain
      CurrentDomain.stubs(property: nil)
    end

    def test_does_not_add_pulse_if_feature_flag_false
      stub_feature_flags_with(:enable_pulse, false)
      view_types_list = @browse_actions_container.send(:view_types_facet)
      refute(view_types_list[:options].any? { |link_item| link_item[:value] == 'pulse'},
          'enable pulse feature flag is false, but we have a pulse link in the catalog')
    end

    def test_does_add_pulse_if_feature_flag_true
      stub_feature_flags_with(:enable_pulse, true)
      view_types_list = @browse_actions_container.send(:view_types_facet)
      assert(view_types_list[:options].any? { |link_item| link_item[:value] == 'pulse'},
        'enable pulse feature flag is true, but we do not have a pulse link in the catalog')
    end

    def test_does_not_add_stories_if_feature_flag_false
      stub_feature_flags_with(:enable_stories, false)
      view_types_list = @browse_actions_container.send(:view_types_facet)
      refute(view_types_list[:options].any? { |link_item| link_item[:value] == 'story'},
          'enable stories feature flag is false, but we have a stories link in the catalog')
    end

    def test_does_add_stories_if_feature_flag_true
      stub_feature_flags_with(:enable_stories, true)
      view_types_list = @browse_actions_container.send(:view_types_facet)
      assert(view_types_list[:options].any? { |link_item| link_item[:value] == 'story'},
        'enable stories feature flag is true, but we do not have a stories link in the catalog')
    end

    def test_does_add_data_lens_if_data_lens_phase_is_post_beta
      stub_feature_flags_with(:data_lens_transition_state, 'post_beta')
      view_types_list = @browse_actions_container.send(:view_types_facet)
      assert(view_types_list[:options].any? { |link_item| link_item[:value] == 'new_view'},
        'data lens transition state is post_beta but we do not have a data lens link in the catalog')
    end
  end
end
