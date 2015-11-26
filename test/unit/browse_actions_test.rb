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
      stub_feature_flags_with(:stories_show_facet_in_catalog, false)
      view_types_list = @browse_actions_container.send(:view_types_facet)
      refute(view_types_list[:options].any? { |link_item| link_item[:value] == 'story'},
          'enable stories feature flag is false, but we have a stories link in the catalog')
    end

    def test_does_add_stories_if_feature_flag_true
      stub_feature_flags_with(:stories_show_facet_in_catalog, true)
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

    # There was a regression around this
    def test_whitelisting_of_view_types_is_respected
      whitelisted_view_type_values = %w(datasets charts)
      CurrentDomain
        .expects(:property)
        .with(:view_types_facet, :catalog)
        .returns(whitelisted_view_type_values)

      view_types_facet = @browse_actions_container.send(:view_types_facet)
      actual_view_type_values = view_types_facet[:options].collect { |vt| vt[:value] }

      assert_equal whitelisted_view_type_values, actual_view_type_values
    end

    # Documenting behavior that is possibly not desired
    def test_defined_but_empty_whitelist_allows_no_view_types
      CurrentDomain
        .expects(:property)
        .with(:view_types_facet, :catalog)
        .returns([])

      view_types_facet = @browse_actions_container.send(:view_types_facet)
      actual_view_type_values = view_types_facet[:options].collect { |vt| vt[:value] }

      assert_empty actual_view_type_values
    end

    # Let's make sure this keeps working
    def test_standard_view_types_show_up_without_whitelisting
      standard_view_types = @browse_actions_container.send(:standard_view_types)

      view_types_facet = @browse_actions_container.send(:view_types_facet)
      actual_view_types = view_types_facet[:options]

      assert standard_view_types.present?
      standard_view_types.each do |svt|
        assert actual_view_types.include?(svt)
      end
    end
  end

  describe 'cetera_feature_flag' do
    def setup
      @browse_actions_container = BrowseActionsContainer.new
      init_current_domain
      stub_feature_flags_with(:cetera_search, true)
      APP_CONFIG.stubs(cetera_host: 'http://api.us.socrata.com/api')
    end

    def test_use_cetera_if_feature_flag_enabled_and_host_present
      assert @browse_actions_container.send(:using_cetera?)
    end

    def test_use_cetera_if_user_is_not_logged_in
      User.stubs(current_user: nil)
      assert @browse_actions_container.send(:using_cetera?)
    end

    def test_use_cetera_if_user_is_logged_in
      User.stubs(current_user: true)
      assert @browse_actions_container.send(:using_cetera?)
    end

    def test_do_not_use_cetera_if_feature_flag_not_enabled
      stub_feature_flags_with(:cetera_search, nil)
      assert !@browse_actions_container.send(:using_cetera?)
    end

    def test_do_not_use_cetera_if_cetera_host_not_present
      APP_CONFIG.stubs(cetera_host: nil)
      assert !@browse_actions_container.send(:using_cetera?)
    end

    # This is an emergency fix and appropriately heinous
    def test_browse_options_for_metadata_facets
      stub_feature_flags_with(:cetera_search, nil)

      # Unsound mess, verify the symbolize_keys move
      custom_facets = [
        { 'singular_description' => 'superhero',
          'title' => 'Superhero',
          'param' => :'Dataset-Information_Superhero',
          'options' => [
            { 'summary' => true, 'text' => 'Superman', 'value' => 'Superman' },
            { 'summary' => true, 'text' => 'Batman', 'value' => 'Batman' },
            { 'summary' => true, 'text' => 'Flash', 'value' => 'Flash' },
            { 'summary' => true, 'text' => 'Spiderman', 'value' => 'Spiderman' },
            { 'summary' => true, 'text' => 'Hulk', 'value' => 'Hulk' }
          ]
        }.symbolize_keys
      ]

      @browse_actions_container.stubs(custom_facets: custom_facets)
      @browse_actions_container.stubs(categories_facet: nil)
      @browse_actions_container.stubs(topics_facet: nil)
      @browse_actions_container.stubs(federations_hash: {})

      CurrentDomain.stubs(configuration: nil)
      CurrentDomain.stubs(default_locale: 'en')
      I18n.stubs(locale: CurrentDomain.default_locale.to_s)

      Clytemnestra.stubs(search_views: [])

      field = :"Dataset-Information_Superhero"
      value = 'Superman'

      request = OpenStruct.new
      request.params = { field => value }

      expected = [[field, value].join(':')]

      assert_equal expected, @browse_actions_container.send(:process_browse, request)[:metadata_tag]
    end
  end

  describe 'selected_category_and_any_children' do
    def setup
      @test_custom_facets = [
        {
          'singular_description' => 'Agencies',
          'title' => 'Agencies & Authorities',
          'param' => :'Dataset-Information_Agency',
          'options' => [
            { 'summary' => true, 'text' => 'Adirondack Park Agency', 'value' => 'Adirondack Park Agency' },
            { 'summary' => true, 'text' => 'Aging, Office for', 'value' => 'Aging, Office for' }
          ]
        }
      ]

      @test_categories = {
        title: 'Categories',
        singular_description: 'category',
        param: :category,
        options: [
          { value: 'Business', text: 'Business' },
          { value: 'Education', text: 'Education' },
          { value: 'Fun', text: 'Fun' },
          { value: 'Test Category 4', text: 'Test Category 4', children: [
            { value: 'Test Category 4a', text: 'Test Category 4a' },
            { value: 'Test Category 4b', text: 'Test Category 4b' }
          ] }
        ],
        extra_options: [
          { value: 'Government', text: 'Government' },
          { value: 'Personal', text: 'Personal' },
          { value: 'Test Category 1', text: 'Test Category 1' },
          { value: 'Test Category 2', text: 'Test Category 2' },
          { value: 'Test Category 3', text: 'Test Category 3' }
        ]
      }

      init_current_domain
      stub_feature_flags_with(:cetera_search, true)
      APP_CONFIG.stubs(cetera_host: 'http://api.us.socrata.com/api')
      CurrentDomain.stubs(configuration: nil)
      CurrentDomain.stubs(default_locale: 'en')
      I18n.stubs(locale: CurrentDomain.default_locale.to_s)

      @browse_actions_container = BrowseActionsContainer.new
      @browse_actions_container.stubs(custom_facets: @test_custom_facets)
      @browse_actions_container.stubs(categories_facet: @test_categories)
      @browse_actions_container.stubs(topics_facet: nil)
      @browse_actions_container.stubs(federations_hash: {})
    end

    def stub_core_for_category(category)
      core_views_url = 'http://localhost:8080/search/views.json'
      core_views_params = {
        category: category,
        limit: 10,
        page: 1
      }.reject { |_, v| v.blank? }
      url = core_views_url + '?' + core_views_params.to_query
      stub_request(:get, url).to_return(status: 200, body: '', headers: {})
    end

    def stub_cetera_for_categories(categories)
      cetera_url = 'http://api.us.socrata.com/api/catalog/v1'
      cetera_params = {
        categories: categories.join(','),
        domains: 'localhost',
        limit: 10,
        offset: 0,
        search_context: 'localhost'
      }.reject { |_, v| v.blank? }
      url = cetera_url + '?' + cetera_params.to_query
      stub_request(:get, url).to_return(status: 200, body: '', headers: {})
    end

    def search_and_return_category_param(category)
      request = OpenStruct.new
      request.params = { category: category }.reject { |_, v| v.blank? }
      browse_options = @browse_actions_container.send(:process_browse, request)
      browse_options[:search_options][:category].to_s.split(',') # NOT REAL CSV FORMAT!
    end

    def test_no_effect_if_cetera_is_not_enabled_and_category_is_present
      stub_feature_flags_with(:cetera_search, false)

      expected_category = 'Test Category 4'
      stub_core_for_category(expected_category)

      assert_equal [expected_category], search_and_return_category_param(expected_category)
    end

    def test_no_effect_if_cetera_is_not_enabled_and_category_is_absent
      stub_feature_flags_with(:cetera_search, false)

      stub_core_for_category(nil)

      assert_empty search_and_return_category_param(nil)
    end

    def test_parent_category_includes_its_children_in_query_to_cetera
      parent_category = 'Test Category 4'
      child_categories = ['Test Category 4a', 'Test Category 4b']

      expected_categories = [parent_category] + child_categories
      stub_cetera_for_categories(expected_categories)

      assert_equal expected_categories, search_and_return_category_param(parent_category)
    end

    def test_child_category_includes_only_itself_in_query_to_cetera
      child_category = 'Test Category 4a'

      expected_categories = [child_category]
      stub_cetera_for_categories(expected_categories)

      assert_equal expected_categories, search_and_return_category_param(child_category)
    end

    def test_categories_with_no_children_query_cetera_only_about_themselves
      childless_category = 'Business'

      expected_categories = [childless_category]
      stub_cetera_for_categories(expected_categories)

      assert_equal expected_categories, search_and_return_category_param(childless_category)
    end

    def test_no_category_results_in_no_category_passed_to_cetera
      expected_categories = []
      stub_cetera_for_categories(expected_categories)

      assert_equal expected_categories, search_and_return_category_param(nil)
    end

    def test_non_existent_category_gets_magically_injected
      # WARN: The existing frontend code will inject any non-existant categories
      # into the categories that we receive from core server if they appear in
      # the URL query string. This is potentially a script injection vector.
      # [ed: so far, we get escaped correctly by the time we get rendered]

      # A user can inject a fake category like so:
      # http://example.com/browse?category=Cloud Cuckoo Land <script>alert("HI!");</script>
      imaginary_category = 'Cloud Cuckoo Land <script>alert("HI!");</script>'

      # And it will show up in the FE's list of displayed categories
      expected_categories = [imaginary_category]
      stub_cetera_for_categories(expected_categories)

      assert_equal expected_categories, search_and_return_category_param(imaginary_category)
    end
  end

  describe 'facets' do
    def facet(name)
      {
        title: name.titleize,
        singular_description: name.downcase.singularize,
        param: name.downcase.to_sym,
        options: [
          { value: 'One', text: 'One' },
          { value: 'Two', text: 'Two' },
          { value: 'Three', text: 'Three', children: [
            { value: 'Three point One', text: 'Three point One' },
            { value: 'Three point Two', text: 'Three point Two' }
          ] }
        ],
        extra_options: [
          { value: 'Four', text: 'Four' },
          { value: 'Five', text: 'Five' },
          { value: 'Six', text: 'Six' }
        ]
      }
    end

    def setup
      @browse_actions_container = BrowseActionsContainer.new
      init_current_domain

      CurrentDomain.stubs(configuration: nil)
      CurrentDomain.stubs(default_locale: 'en')
      I18n.stubs(locale: CurrentDomain.default_locale.to_s)

      Clytemnestra.stubs(search_views: [])

      @browse_actions_container.stubs(federations_hash: {})

      # It's important to have multiple custom facets so we can test that
      # we aren't hardcoding to the 3rd slot regardless
      @browse_actions_container.stubs(
        custom_facets: [
          facet('custom superheroes'),
          facet('custom tomatoes'),
          facet('custom follies')
        ]
      )

      %w(
        categories_facet
        federated_facet
        moderation_facet
        topics_facet
        view_types_facet
      ).each do |type_of_facet|
        name = type_of_facet.split('_').first
        @browse_actions_container.stubs(type_of_facet.to_sym => facet(name))
      end
    end

    def test_categories_come_third_in_old_view_types
      request = OpenStruct.new(
        params: { view_type: 'browse2' }.with_indifferent_access
      )
      request.params = { view_type: 'browse2' }
      browse_options = @browse_actions_container.send(:process_browse, request)
      facet_titles = browse_options[:facets].map { |f| f[:title] }
      expected_titles = [
        'Categories',
        'View',
        'Custom Superheroes',
        'Custom Tomatoes',
        'Custom Follies',
        'Topics',
        'Federated'
      ]

      expected_titles.each_with_index do |expected, index|
        actual = facet_titles[index]
        assert_equal expected, actual
      end
    end

    def test_categories_come_first_in_browse2
      request = OpenStruct.new(
        params: {}.with_indifferent_access
      )
      browse_options = @browse_actions_container.send(:process_browse, request)
      facet_titles = browse_options[:facets].map { |f| f[:title] }
      expected_titles = [
        'View',
        'Custom Superheroes',
        'Custom Tomatoes',
        'Custom Follies',
        'Categories',
        'Topics',
        'Federated'
      ]

      expected_titles.each_with_index do |expected, index|
        actual = facet_titles[index]
        assert_equal expected, actual
      end
    end
  end
end
