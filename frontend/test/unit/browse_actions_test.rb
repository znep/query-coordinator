require 'test_helper'
require 'ostruct'

class BrowseActionsTest < Minitest::Test

# Test building of the catalog links
  def setup
    @browse_controller = BrowseController.new

    init_current_domain
    init_feature_flag_signaller

    Canvas2::Util.reset

    CurrentDomain.stubs(:property => nil)

    @browse_controller.stubs(:current_user => nil)
  end

  def test_does_not_add_pulse_if_feature_flag_false
    stub_feature_flags_with(:enable_pulse => false)
    view_types_list = @browse_controller.send(:view_types_facet)
    refute(view_types_list[:options].any? { |link_item| link_item[:value] == 'pulse'},
        'enable pulse feature flag is false, but we have a pulse link in the catalog')
  end

  def test_does_add_pulse_if_feature_flag_true
    stub_feature_flags_with(:enable_pulse => true)
    view_types_list = @browse_controller.send(:view_types_facet)
    assert(view_types_list[:options].any? { |link_item| link_item[:value] == 'pulse'},
      'enable pulse feature flag is true, but we do not have a pulse link in the catalog')
  end

  def test_does_not_add_measures_if_feature_flag_false
    stub_feature_flags_with(:open_performance_standalone_measures => false)
    view_types_list = @browse_controller.send(:view_types_facet)
    refute(view_types_list[:options].any? { |link_item| link_item[:value] == 'measure'},
           'The open_performance_standalone_measures flag is false, but we have a measures link in the catalog')
  end

  def test_does_add_measures_if_feature_flag_true
    stub_feature_flags_with(:open_performance_standalone_measures => true)
    view_types_list = @browse_controller.send(:view_types_facet)
    assert(view_types_list[:options].any? { |link_item| link_item[:value] == 'measure'},
      'The open_performance_standalone_measures flag is true, but we do not have a measures link in the catalog')
  end

  def test_does_not_add_drafts_by_default_if_feature_flag_false
    stub_feature_flags_with(:ingress_reenter => false)
    view_types_list = @browse_controller.send(:view_types_facet)
    refute(view_types_list[:options].any? { |link_item| link_item[:value] == 'draft'},
           'The draft dataset is showing up by default on the public catalog')
  end

  def test_does_not_add_stories_if_feature_flag_false
    stub_feature_flags_with(:stories_show_facet_in_catalog => false)
    view_types_list = @browse_controller.send(:view_types_facet)
    refute(view_types_list[:options].any? { |link_item| link_item[:value] == 'story'},
        'enable stories feature flag is false, but we have a stories link in the catalog')
  end

  def test_does_add_stories_if_feature_flag_true
    stub_feature_flags_with(:stories_show_facet_in_catalog => true)
    view_types_list = @browse_controller.send(:view_types_facet)
    assert(view_types_list[:options].any? { |link_item| link_item[:value] == 'story'},
      'enable stories feature flag is true, but we do not have a stories link in the catalog')
  end

  def test_contains_data_lens_regardless_of_feature_flags
    stub_feature_flags_with(:data_lens_transition_state => 'pre_beta')
    view_types_list = @browse_controller.send(:view_types_facet)
    assert(view_types_list[:options].any? { |link_item| link_item[:value] == 'new_view'},
      'we should always have a Datalens link but it is missing!')
  end

  def test_does_not_add_api_if_using_cetera_search
    stub_feature_flags_with(:cetera_search => true)
    view_types_list = @browse_controller.send(:view_types_facet)
    refute(view_types_list[:options].any? { |link_item| link_item[:value] == 'api'},
      'cetera search feature flag is true, but we have an api link in the catalog')
  end

  # There was a regression around this
  def test_whitelisting_of_view_types_is_respected
    whitelisted_view_type_values = %w(datasets charts)
    CurrentDomain
      .expects(:property)
      .with(:view_types_facet, :catalog)
      .returns(whitelisted_view_type_values)

    view_types_facet = @browse_controller.send(:view_types_facet)
    actual_view_type_values = view_types_facet[:options].collect { |vt| vt[:value] }

    assert_equal whitelisted_view_type_values, actual_view_type_values
  end

  # Documenting behavior that is possibly not desired
  def test_defined_but_empty_whitelist_allows_no_view_types
    CurrentDomain
      .expects(:property)
      .with(:view_types_facet, :catalog)
      .returns([])

    view_types_facet = @browse_controller.send(:view_types_facet)
    actual_view_type_values = view_types_facet[:options].collect { |vt| vt[:value] }

    assert_empty actual_view_type_values
  end

  # Let's make sure this keeps working
  def test_standard_view_types_show_up_without_whitelisting
    standard_view_types = @browse_controller.send(:standard_view_types)

    view_types_facet = @browse_controller.send(:view_types_facet)
    actual_view_types = view_types_facet[:options]

    assert standard_view_types.present?
    standard_view_types.each do |svt|
      assert actual_view_types.include?(svt)
    end
  end
end

class BrowseActionsTest2 < Minitest::Test
  def setup
    @browse_controller = BrowseController.new

    init_current_domain
    init_feature_flag_signaller

    Canvas2::Util.reset

    CurrentDomain.stubs(:property => {:catalog => {:sortBy => 'relevance'}})

    stub_feature_flags_with(:cetera_search => true)

    APP_CONFIG.stubs(
      cetera_internal_uri: 'http://cetera.app.aws-us-east-1-fedramp-prod.socrata.net'
    )
  end

  def test_do_not_use_cetera_if_cetera_internal_uri_not_present
    APP_CONFIG.stubs(cetera_internal_uri: nil)
    refute @browse_controller.send(:using_cetera?)
  end

  def test_do_not_use_cetera_on_admin_datasets
    @browse_controller.stubs(:action_name => 'datasets', :controller_name => 'administration')
    refute @browse_controller.send(:using_cetera?), 'expected using_cetera? = false when path /admin/datasets'
  end

  def test_do_not_use_cetera_on_admin_views
    @browse_controller.stubs(:action_name => 'views', :controller_name => 'administration')
    refute @browse_controller.send(:using_cetera?), 'expected using_cetera? = false when path /admin/views'
  end

  def test_use_cetera_on_browse
    @browse_controller.stubs(:using_cetera? => true)
    BrowseController.any_instance.stubs(:request => OpenStruct.new(path: '/browse') )
    assert @browse_controller.send(:using_cetera?), 'expected using_cetera? = true when path /browse'
  end

  def test_use_cetera_on_dataslated_home_browse
    @browse_controller.stubs(:using_cetera? => true)
    BrowseController.any_instance.stubs(:request => OpenStruct.new(path: '/') )
    assert @browse_controller.send(:using_cetera?), 'expected using_cetera? = true when path /'
  end

  # This is an emergency fix and appropriately heinous
  def test_browse_options_for_metadata_facets
    stub_feature_flags_with(:cetera_search => false)

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

    @browse_controller.stubs(custom_facets: custom_facets)
    @browse_controller.stubs(categories_facet: nil)
    @browse_controller.stubs(topics_facet: nil)
    @browse_controller.stubs(:using_cetera? => false)
    Federation.stubs(federations: [])

    CurrentDomain.stubs(configuration: nil)
    CurrentDomain.stubs(default_locale: 'en')
    I18n.stubs(locale: CurrentDomain.default_locale.to_s)

    Clytemnestra.stubs(search_views: [])

    field = 'Dataset-Information_Superhero'.to_sym
    value = 'Superman'
    request = OpenStruct.new(:params => { field => value })
    expected = [[field, value].join(':')]

    assert_equal expected, @browse_controller.send(:process_browse, request)[:metadata_tag]
  end
end

class BrowseActionsTest3 < Minitest::Test
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
    init_feature_flag_signaller

    Canvas2::Util.reset

    CurrentDomain.stubs(:property => {:catalog => {:sortBy => 'relevance'}})
    CurrentDomain.stubs(configuration: nil)
    CurrentDomain.stubs(default_locale: 'en')

    stub_feature_flags_with(:cetera_search => true)

    I18n.stubs(locale: CurrentDomain.default_locale.to_s)

    @browse_controller = BrowseController.new
    @browse_controller.stubs(custom_facets: @test_custom_facets)
    @browse_controller.stubs(categories_facet: @test_categories)
    @browse_controller.stubs(topics_facet: nil)

    Federation.stubs(federations: [])
  end

  def stub_core_for_category(category)
    core_views_url = 'http://localhost:8080/search/views.json'
    core_views_params = {
      category: category,
      limit: 10,
      page: 1
    }.reject { |_, v| v.blank? }
    url = core_views_url + '?' + core_views_params.to_query
    stub_request(:get, url).to_return(status: 200, body: '', headers: {'Content-Type'=>'application/json', 'X-Socrata-Host'=>'localhost', 'X-Socrata-Requestid'=>''})
  end

  def stub_core_for_category_and_browse(category, datatypes = nil, extra_params = {})
    core_views_url = 'http://localhost:8080/search/views.json'
    core_views_params = {
      category: category,
      limit: 10,
      page: 1,
      limitTo: datatypes,
      sortBy: 'relevance',
    }.merge(extra_params).reject { |_, v| v.blank? }
    url = core_views_url + '?' + core_views_params.to_query
    stub_request(:get, url).to_return(status: 200, body: '', headers: {'Content-Type'=>'application/json', 'X-Socrata-Host'=>'localhost', 'X-Socrata-Requestid'=>''})
  end

  def stub_cetera_for_categories_and_browse(categories, datatypes = nil, extra_params = {})
    cetera_url = 'localhost:5704/catalog/v1'
    cetera_params = {
      categories: categories,
      only: datatypes,
      domains: 'localhost',
      limit: 10,
      offset: 0,
      order: 'relevance',
      search_context: 'localhost',
      approval_status: 'approved',
      public: true,
      published: true,
      explicitly_hidden: false
    }.merge(extra_params).reject { |_, v| v.nil? }
    url = cetera_url + '?' + cetera_params.to_query
    stub_request(:get, url).to_return(status: 200, body: '', headers: {'Content-Type'=>'application/json', 'X-Socrata-Host'=>'localhost', 'X-Socrata-Requestid'=>''})
  end

  def category_4_categories
    parent_category = 'Test Category 4'
    child_categories = ['Test Category 4a', 'Test Category 4b']
    [parent_category] | child_categories
  end

  # backward compatibility with core/clytemnestra
  def search_and_return_category_param(category)
    request = OpenStruct.new(:params => { category: category }.reject { |_, v| v.blank? })
    browse_options = @browse_controller.send(:process_browse, request)
    browse_options[:search_options][:category].to_s.split(',') # NOT REAL CSV FORMAT!
  end

  # cetera catalog api
  def search_and_return_cetera_categories_param(category)
    @browse_controller.stubs(:using_cetera? => true)
    request = OpenStruct.new(:params => { category: category })
    browse_options = @browse_controller.send(:process_browse, request)
    browse_options[:search_options][:categories]
  end

  ##################################################
  # Lots of tests around official boost
  #
  # - if cetera is enabled
  #   - if the feature flag `cetera_search_boost_official_assets` is true
  #     - if the catalog configuration doesn't have an official boost specified
  #       => search_options[boostOfficial] should be 2.0
  #     - if `official_boost` is set to a number > 0
  #       => search_options[boostOfficial] should be that number
  #     - if `official_boost` is set to a non-number or a number < 0
  #       => search_options[boostOfficial] should be 2.0
  #   - else if feature flag off or none
  #     => no boostOfficial
  # - else if we're in cly-land
  #   => no boostOfficial
  ##################################################
  DEFAULT_OFFICIAL_BOOST = 2.0

  def cetera_official_boost(using_cetera, boost_official, official_boost_amt, expected_boost)
    stub_feature_flags_with(:cetera_search_boost_official_assets => boost_official)
    @browse_controller.stubs(:using_cetera? => using_cetera)
    request = OpenStruct.new(:params => { category: 'Test Category 4' })
    options = {limitTo: 'tables'}
    if using_cetera
      if boost_official
        amt = official_boost_amt || DEFAULT_OFFICIAL_BOOST
        stub_cetera_for_categories_and_browse(category_4_categories, 'datasets',
                                              { :boostOfficial => amt })
      else
        stub_cetera_for_categories_and_browse(category_4_categories, 'datasets')
      end
    else
      # don't stub boosts -- we don't expect boost to ever be called from the cly fork
      stub_core_for_category_and_browse('Test Category 4', 'tables')
    end
    browse_options = @browse_controller.send(:process_browse, request, options)
    if expected_boost == nil
      refute browse_options[:search_options].key?(:boostOfficial)
    else
      assert_equal expected_boost, browse_options[:search_options][:boostOfficial]
    end
  end

  def test_process_browse_official_boost
    expectations = {
      # [using_cetera, boost_official, official_boost_amt] => expected_boost
      [true, true, nil] => DEFAULT_OFFICIAL_BOOST,
      [true, true, 'foo'] => DEFAULT_OFFICIAL_BOOST,
      [true, true, '5.0'] => 5.0,
      [true, false, nil] => nil,
      [true, false, 'foo'] => nil,
      [true, false, '5.0'] => nil,
      [false, true, nil] => nil,
      [false, true, 'foo'] => nil,
      [false, true, '5.0'] => nil,
      [false, false, nil] => nil,
      [false, false, 'foo'] => nil,
      [false, false, '5.0'] => nil,
    }
    expectations.each do |(uc, bo, oba), eb|
      CurrentDomain.stubs(:property).with(:official_boost, :catalog).returns(oba)
      cetera_official_boost(uc, bo, oba, eb)
    end
  end

  def test_process_browse_unpublished_includes_drafts_if_feature_flag_enabled
    stub_feature_flags_with(:ingress_reenter => true)
    @browse_controller.stubs(:using_cetera? => true)
    request = OpenStruct.new(:params => { category: 'Test Category 4' })
    options = {limitTo: 'unpublished'}
    stub_cetera_for_categories_and_browse(category_4_categories, ['datasets', 'drafts'])
    browse_options = @browse_controller.send(:process_browse, request, options)
    assert_equal ['draft', 'tables'], browse_options[:search_options][:limitTo]
  end

  def test_process_browse_unpublished_excludes_drafts_if_feature_flag_false
    @browse_controller.stubs(:using_cetera? => true)
    stub_feature_flags_with(:ingress_reenter => false)
    request = OpenStruct.new(:params => { category: 'Test Category 4' })
    options = {limitTo: 'unpublished'}
    stub_cetera_for_categories_and_browse(category_4_categories, 'datasets')
    browse_options = @browse_controller.send(:process_browse, request, options)
    assert_equal 'tables', browse_options[:search_options][:limitTo]
  end

  def test_no_effect_if_cetera_is_not_enabled_and_category_is_present
    stub_feature_flags_with(:cetera_search => false)
    cly_unaffected_category = 'Test Category 4'

    stub_request(:get, 'http://localhost:8080/search/views.json?category=Test%20Category%204&limit=10&page=1&sortBy=relevance').
      with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
      to_return(:status => 200, :body => '', :headers => {})

    expected_category = 'Test Category 4'
    stub_core_for_category(expected_category)
    User.stubs(:current_user => nil)
    assert_equal [expected_category], search_and_return_category_param(cly_unaffected_category)
  end

  def test_no_effect_if_cetera_is_not_enabled_and_category_is_absent
    stub_feature_flags_with(:cetera_search => false)

    stub_core_for_category(nil)

    stub_request(:get, 'http://localhost:8080/search/views.json?limit=10&page=1&sortBy=relevance').
      with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
      to_return(:status => 200, :body => '', :headers => {})

    User.stubs(:current_user => nil)
    assert_empty search_and_return_category_param(nil)
  end

  def test_parent_category_includes_its_children_in_query_to_cetera
    stub_cetera_for_categories_and_browse(category_4_categories)
    @browse_controller.stubs(:using_cetera? => true)

    assert_equal category_4_categories, search_and_return_cetera_categories_param('Test Category 4')
  end

  def test_child_category_includes_only_itself_in_query_to_cetera
    child_category = 'Test Category 4a'

    expected_categories = [child_category]
    stub_cetera_for_categories_and_browse(expected_categories)
    @browse_controller.stubs(:using_cetera? => true)

    assert_equal expected_categories, search_and_return_cetera_categories_param(child_category)
  end

  def test_categories_with_no_children_query_cetera_only_about_themselves
    childless_category = 'Business'

    expected_categories = [childless_category]
    stub_cetera_for_categories_and_browse(expected_categories)

    assert_equal expected_categories, search_and_return_cetera_categories_param(childless_category)
  end

  def test_no_category_results_in_no_category_passed_to_cetera
    no_category = nil

    stub_cetera_for_categories_and_browse(expected_categories = nil)

    refute(search_and_return_cetera_categories_param(no_category))
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
    stub_cetera_for_categories_and_browse(expected_categories)
    @browse_controller.stubs(:using_cetera? => true)

    assert_equal expected_categories, search_and_return_cetera_categories_param(imaginary_category)
  end
end

class BrowseActionsTest4 < Minitest::Test
  def facet(name)
    # WARN: custom_facets is Hashie::Mash, but others are just hashes
    {
      title: name.titleize,
      singular_description: name.downcase.singularize,
      # param is quite wrong for the view_types_facet and possibly others
      param: name == 'categories' ? :category : name.downcase.to_sym,
      options: [
        { value: 'One', text: 'One' },
        { value: 'Two', text: 'Two' },
        { value: 'Three', text: 'Three', children: [
          { value: 'Three point One', text: 'Three point One' },
          { value: 'Three point Two', text: 'Three point Two' }
        ] },
        { value: 'Four', text: 'Four' },
        { value: 'Five', text: 'Five' },
        { value: 'Six', text: 'Six' }
      ]
    }
  end

  def setup
    @browse_controller = BrowseController.new
    init_current_domain
    init_feature_flag_signaller

    Canvas2::Util.reset

    CurrentDomain.stubs(:property => {:catalog => {:sortBy => 'relevance'}})
    CurrentDomain.stubs(configuration: nil)
    CurrentDomain.stubs(default_locale: 'en')

    I18n.stubs(locale: CurrentDomain.default_locale.to_s)

    Clytemnestra.stubs(search_views: [])

    Federation.stubs(federations: [])

    # It's important to have multiple custom facets so we can test that
    # we aren't hardcoding to the 3rd slot regardless
    @browse_controller.stubs(get_facet_cutoff: 3)
    CurrentDomain.stubs(:property).with(:custom_facets, :catalog).returns([
      Hashie::Mash.new(facet('custom superheroes')),
      Hashie::Mash.new(facet('custom tomatoes')),
      Hashie::Mash.new(facet('custom follies'))
    ])

    # TODO: These facets should not be stubbed
    # Instead, they should each actually be tested
    %w(
      categories_facet
      federated_facet
      moderation_facet
      topics_facet
      view_types_facet
    ).each do |type_of_facet|
      name = type_of_facet.gsub('_facet', '')
      @browse_controller.stubs(type_of_facet.to_sym => facet(name))
    end

    stub_request(:get, "http://localhost:8080/tags?method=viewsTags").with(:headers => request_headers).
      to_return(:status => 200, :body => %q([{"frequency":2,"name":"other","flags":[]},{"frequency":2,"name":"tag","flags":[]},{"frequency":1,"name":"crazy","flags":[]},{"frequency":1,"name":"keyword","flags":[]},{"frequency":1,"name":"neato","flags":[]},{"frequency":1,"name":"ufo","flags":[]},{"frequency":1,"name":"weird","flags":[]}]), :headers => {})

    stub_request(:get, "http://localhost:5704/catalog/v1/domain_tags?approval_status=approved&domains=localhost&explicitly_hidden=false&offset=0&order=relevance&public=true&published=true&search_context=localhost").
      with(:headers => {'Content-Type' => 'application/json', 'X-Socrata-Host' => 'localhost'}).
      to_return(:status => 200, :body => %q({"results":[{"domain_tag":"crazy", "count":1},{"domain_tag":"other", "count":2},{"domain_tag":"tag", "count":2},{"domain_tag":"keyword", "count":1},{"domain_tag":"neato", "count":1},{"domain_tag":"ufo", "count":1},{"domain_tag":"weird", "count":1}],"resultSetSize":7,"timings":{"serviceMillis":4, "searchMillis":[1, 1]}}), :headers => { 'Content-Type': 'application/json' })

    stub_request(:get, "http://localhost:5704/catalog/v1?approval_status=approved&domains=localhost&explicitly_hidden=false&limit=10&offset=0&order=relevance&public=true&published=true&search_context=localhost").
      with(:headers => {'Content-Type'=>'application/json', 'X-Socrata-Host'=>'localhost'}).
      to_return(:status => 200, :body => "", :headers => {})

  end

  def test_cly_topics_facet_without_param
    stub_feature_flags_with(:cetera_search => false)
    @browse_controller.unstub(:topics_facet)
    facets = @browse_controller.send(:topics_facet).with_indifferent_access
    expected_facets = JSON.parse('{"type":"topic","title":"Topics","singular_description":"topic","param":"tags","options":[{"text":"crazy","value":"crazy","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2}],"extra_options":[{"text":"crazy","value":"crazy","count":1},{"text":"keyword","value":"keyword","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2},{"text":"ufo","value":"ufo","count":1},{"text":"weird","value":"weird","count":1}],"tag_cloud":true}').with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    assert_equal(expected_facets, facets)
  end

  def test_cly_topics_facet_with_matching_param
    stub_feature_flags_with(:cetera_search => false)
    @browse_controller.unstub(:topics_facet)
    facets = @browse_controller.send(:topics_facet, :tags => 'neato').with_indifferent_access
    expected_facets = {"type"=>:topic, "title"=>"Topics", "singular_description"=>"topic", "param"=>:tags, "options"=>[{"text"=>"crazy", "value"=>"crazy", "count"=>1}, {"text"=>"neato", "value"=>"neato", "count"=>0}, {"text"=>"other", "value"=>"other", "count"=>2}, {"text"=>"tag", "value"=>"tag", "count"=>2}], "extra_options"=>[{"text"=>"crazy", "value"=>"crazy", "count"=>1}, {"text"=>"keyword", "value"=>"keyword", "count"=>1}, {"text"=>"neato", "value"=>"neato", "count"=>1}, {"text"=>"other", "value"=>"other", "count"=>2}, {"text"=>"tag", "value"=>"tag", "count"=>2}, {"text"=>"ufo", "value"=>"ufo", "count"=>1}, {"text"=>"weird", "value"=>"weird", "count"=>1}], "tag_cloud"=>true}.with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    assert_equal(expected_facets, facets) # Failing due to ordering?
  end

  def test_cly_topics_facet_with_non_matching_param
    stub_feature_flags_with(:cetera_search => false)
    @browse_controller.unstub(:topics_facet)
    expected_facets = JSON.parse('{"type":"topic","title":"Topics","singular_description":"topic","param":"tags","options":[{"text":"crazy","value":"crazy","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2}],"extra_options":[{"text":"crazy","value":"crazy","count":1},{"text":"keyword","value":"keyword","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2},{"text":"ufo","value":"ufo","count":1},{"text":"weird","value":"weird","count":1}],"tag_cloud":true}').with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    facets = @browse_controller.send(:topics_facet, :tags => 'unknown').with_indifferent_access
    expected_facets['options'] = facets['options'].push('text' => 'unknown', 'value' => 'unknown', 'count' => 0)
    assert_equal(expected_facets, facets)
  end

  def test_cetera_topics_facet_without_param
    stub_feature_flags_with(:cetera_search => true)
    @browse_controller.unstub(:topics_facet)
    facets = @browse_controller.send(:topics_facet).with_indifferent_access
    expected_facets = JSON.parse('{"type":"topic","title":"Tags","singular_description":"tag","param":"tags","options":[{"text":"crazy","value":"crazy","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2}],"extra_options":[{"text":"crazy","value":"crazy","count":1},{"text":"keyword","value":"keyword","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2},{"text":"ufo","value":"ufo","count":1},{"text":"weird","value":"weird","count":1}],"tag_cloud":true}').with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    assert_equal(expected_facets, facets)
  end

  def test_cetera_topics_facet_with_matching_param
    stub_feature_flags_with(:cetera_search => true)
    @browse_controller.unstub(:topics_facet)
    facets = @browse_controller.send(:topics_facet, :tags => 'neato').with_indifferent_access
    expected_facets = {"type"=>:topic, "title"=>"Tags", "singular_description"=>"tag", "param"=>:tags, "options"=>[{"text"=>"crazy", "value"=>"crazy", "count"=>1}, {"text"=>"neato", "value"=>"neato", "count"=>0}, {"text"=>"other", "value"=>"other", "count"=>2}, {"text"=>"tag", "value"=>"tag", "count"=>2}], "extra_options"=>[{"text"=>"crazy", "value"=>"crazy", "count"=>1}, {"text"=>"keyword", "value"=>"keyword", "count"=>1}, {"text"=>"neato", "value"=>"neato", "count"=>1}, {"text"=>"other", "value"=>"other", "count"=>2}, {"text"=>"tag", "value"=>"tag", "count"=>2}, {"text"=>"ufo", "value"=>"ufo", "count"=>1}, {"text"=>"weird", "value"=>"weird", "count"=>1}], "tag_cloud"=>true}.with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    assert_equal(expected_facets, facets) # Failing due to ordering?
  end

  def test_cetera_topics_facet_with_non_matching_param
    stub_feature_flags_with(:cetera_search => true)
    @browse_controller.unstub(:topics_facet)
    facets = @browse_controller.send(:topics_facet, :tags => 'unknown').with_indifferent_access
    expected_facets = JSON.parse('{"type":"topic","title":"Tags","singular_description":"tag","param":"tags","options":[{"text":"crazy","value":"crazy","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2}],"extra_options":[{"text":"crazy","value":"crazy","count":1},{"text":"keyword","value":"keyword","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2},{"text":"ufo","value":"ufo","count":1},{"text":"weird","value":"weird","count":1}],"tag_cloud":true}').with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    expected_facets['options'] = facets['options'].push('text' => 'unknown', 'value' => 'unknown', 'count' => 0)
    assert_equal(expected_facets, facets)
  end

  def test_categories_come_first_in_new_catalog
    stub_feature_flags_with('cetera_search' => true)
    request = OpenStruct.new(params: { cetera_search: 'true' }.with_indifferent_access)
    @browse_controller.unstub(:topics_facet)
    browse_options = @browse_controller.send(:process_browse, request)
    facet_titles = browse_options[:facets].map { |f| f[:title] }
    expected_titles = [
      'Categories',
      'View Types',
      'Custom Superheroes',
      'Custom Tomatoes',
      'Custom Follies',
      'Tags',
      'Federated'
    ]

    expected_titles.each_with_index do |expected, index|
      actual = facet_titles[index]
      assert_equal expected, actual
    end
  end

  def test_categories_come_third_in_old_view_types
    # By third we mean [view_types, custom_facets, categories]
    stub_feature_flags_with(:cetera_search => false)
    request = OpenStruct.new(params: {}.with_indifferent_access)
    browse_options = @browse_controller.send(:process_browse, request)
    facet_titles = browse_options[:facets].pluck(:title)
    expected_titles = [
      'Categories',
      'View Types',
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

  def test_categories_facet_works_nil_extra_options
    request = OpenStruct.new(params: { category: 'Some Random Category' }.with_indifferent_access)

    # Let's have nil for extra options
    @browse_controller.stubs(categories_facet: facet('categories').merge(extra_options: nil))
    browse_options = @browse_controller.send(:process_browse, request)
    cat_facet = browse_options[:facets].find { |f| f[:title] == 'Categories' }
    refute(cat_facet[:extra_options]) # make sure the test setup worked

    # This used to raise a TypeError as per EN-760
    res = @browse_controller.send(:selected_category_and_any_children, browse_options)
    assert_equal ['Some Random Category'], res
  end

  def test_custom_facets_respect_facet_cutoff_when_nothing_is_selected
    request = OpenStruct.new(params: {}.with_indifferent_access)

    # NOTE: Setting facet_cutoff to 0 has inconsistent behavior across facets
    (1..10).each do |cutoff|
      @browse_controller.stubs(get_facet_cutoff: cutoff)
      assert_equal cutoff, @browse_controller.send(:get_facet_cutoff, :custom)

      browse_options = @browse_controller.send(:process_browse, request)
      facet = browse_options[:facets].find { |o| o[:param] == :'custom superheroes' }

      expected_options_size = [cutoff, 6].min # can't have more options than exist
      assert_equal expected_options_size, facet[:options].size
      assert_equal 6 - expected_options_size, facet[:extra_options].to_a.size
    end
  end

  def test_custom_facets_always_show_selected_option_above_fold
    facet_name = 'custom superheroes'
    facet_value = 'Six'
    request = OpenStruct.new(
      params: { facet_name => facet_value }.with_indifferent_access
    )

    # NOTE: Setting facet_cutoff to 0 has inconsistent behavior across facets
    (1..10).each do |cutoff|
      @browse_controller.stubs(get_facet_cutoff: cutoff)
      browse_options = @browse_controller.send(:process_browse, request)

      facet = browse_options[:facets].find { |o| o[:param] == facet_name.to_sym }
      options = facet[:options]
      extra_options = facet[:extra_options].to_a # extra_options can be missing/nil

      # cutoff + 1 because we append our selected option
      # min because we can't have more visibile options than exist
      expected_options_size = [cutoff + 1, 6].min
      assert_equal expected_options_size, options.size

      # Make sure our selected option is showing up only once
      assert_equal 1, (options + extra_options).count { |o| o['value'] == facet_value }

      # Make sure we have the right number of extra (hidden) options
      assert_equal 6 - expected_options_size, extra_options.size

      assert_equal(facet_value, options.last['value'])
    end
  end

  # NOTE: Custom facets have an interesting and unexpected behavior; namely
  # if you set 'summary':true in an entry in the the custom_facets field of
  # the catalog config (in the admin interface), this will guarantee their
  # display regardless of any facet cutoff thresholds (either default or
  # explicitly set in the facets_cutoff field of the catalog config).
  def custom_facets_catalog
    [
      Hashie::Mash.new(
        'singular_description' => 'superhero',
        'title' => 'Superhero',
        'param' => 'Dataset-Information_Superhero',
        'options' => [
          { 'summary' => false, 'text' => 'Alphaman', 'value' => 'Alphaman' },
          { 'summary' => false, 'text' => 'Batman', 'value' => 'Batman' },
          { 'summary' => true, 'text' => 'Crash Override', 'value' => 'Crash Override' },
          { 'summary' => true, 'text' => 'Doctor Octopus', 'value' => 'Doctor Octopus' },
          { 'summary' => true, 'text' => 'Echo + Bunnymen', 'value' => 'Echo + Bunnymen' }
        ]
      )
    ]
  end

  def process_custom_facets_catalog(cutoff)
    CurrentDomain.stubs(:property).with(:custom_facets, :catalog).returns(custom_facets_catalog)
    @browse_controller.stubs(get_facet_cutoff: cutoff)
    browse_options = @browse_controller.send(:process_browse, OpenStruct.new(params: {}))

    # We go in as a Hashie::Mash but come back as a normal hash
    facet = browse_options[:facets].find { |fct| fct[:title] == 'Superhero' }
    [facet[:options], facet[:extra_options]]
  end

  def expected_partitions
    # Make sure our setup is what we expect
    options = custom_facets_catalog.first.options
    assert_equal 3, options.count(&:summary)
    assert_equal 5, options.count

    {
      # Set cutoff one below options.count(&:summary)
      2 => { option_texts: ['Crash Override', 'Doctor Octopus', 'Echo + Bunnymen'],
             extra_option_texts: ['Alphaman', 'Batman'] },

      # Set cutoff equal to options.count(&:summary)
      3 => { option_texts: ['Crash Override', 'Doctor Octopus', 'Echo + Bunnymen'],
             extra_option_texts: ['Alphaman', 'Batman'] },

      # NOTE: possibly surprising behavior
      # 'summary':true options take sort order precedence when there are hidden options
      # Set cutoff above options.count(&:summary) but below options.count
      4 => { option_texts: ['Crash Override', 'Doctor Octopus', 'Echo + Bunnymen'],
             extra_option_texts: ['Alphaman', 'Batman'] },

      # NOTE: possibly surprising behavior
      # 'summary':true options do not take sort order precedence when there are no hidden options
      # Set cutoff equal to options.count
      5 => { option_texts: ['Alphaman', 'Batman', 'Crash Override', 'Doctor Octopus', 'Echo + Bunnymen'],
             extra_option_texts: [] },

      # Set cutoff above options.count
      6 => { option_texts: ['Alphaman', 'Batman', 'Crash Override', 'Doctor Octopus', 'Echo + Bunnymen'],
             extra_option_texts: [] },
    }
  end

  def test_custom_facet_partitioning_with_summary_true
    expected_partitions.each do |(cutoff, expected)|
      options, extra_options = process_custom_facets_catalog(cutoff)

      assert_equal(expected[:option_texts],
                   options.pluck('text'),
                   "Failure of options at cutoff level #{cutoff}")

      assert_equal(expected[:extra_option_texts],
                   extra_options.to_a.pluck('text'),
                   "Failure of extra_options at cutoff level #{cutoff}")
    end
  end
end
