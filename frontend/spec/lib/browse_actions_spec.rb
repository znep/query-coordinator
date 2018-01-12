require 'rails_helper'
require 'ostruct'

describe BrowseActions do
  include TestHelperMethods

# Test building of the catalog links
  before do
    @browse_controller = BrowseController.new

    init_current_domain
    init_feature_flag_signaller

    Canvas2::Util.reset

    allow(CurrentDomain).to receive(:property).and_return(nil)

    allow(@browse_controller).to receive(:current_user).and_return(nil)
  end

  it 'test_does_not_add_pulse_if_feature_flag_false' do
    stub_feature_flags_with(:enable_pulse => false)
    view_types_list = @browse_controller.send(:view_types_facet)
    expect(view_types_list[:options].any? { |link_item| link_item[:value] == 'pulse'}).to be_falsy
  end

  it 'test_does_add_pulse_if_feature_flag_true' do
    stub_feature_flags_with(:enable_pulse => true)
    view_types_list = @browse_controller.send(:view_types_facet)
    expect(view_types_list[:options].any? { |link_item| link_item[:value] == 'pulse'}).to be_truthy
  end

  it 'test_does_not_add_measures_if_feature_flag_false' do
    stub_feature_flags_with(:open_performance_standalone_measures => false)
    view_types_list = @browse_controller.send(:view_types_facet)
    expect(view_types_list[:options].any? { |link_item| link_item[:value] == 'measure'}).to be_falsy
    # The open_performance_standalone_measures flag is false, but we have a measures link in the catalog
  end

  it 'test_does_add_measures_if_feature_flag_true' do
    stub_feature_flags_with(:open_performance_standalone_measures => true)
    view_types_list = @browse_controller.send(:view_types_facet)
    expect(view_types_list[:options].any? { |link_item| link_item[:value] == 'measure'}).to be_truthy
    # The open_performance_standalone_measures flag is true, but we do not have a measures link in the catalog
  end

  it 'test_does_not_add_drafts_by_default_if_feature_flag_false' do
    stub_feature_flags_with(:ingress_reenter => false)
    view_types_list = @browse_controller.send(:view_types_facet)
    expect(view_types_list[:options].any? { |link_item| link_item[:value] == 'draft'}).to be_falsy
  end

  it 'test_does_not_add_stories_if_feature_flag_false' do
    stub_feature_flags_with(:stories_show_facet_in_catalog => false)
    view_types_list = @browse_controller.send(:view_types_facet)
    expect(view_types_list[:options].any? { |link_item| link_item[:value] == 'story'}).to be_falsy
  end

  it 'test_does_add_stories_if_feature_flag_true' do
    stub_feature_flags_with(:stories_show_facet_in_catalog => true)
    view_types_list = @browse_controller.send(:view_types_facet)
    expect(view_types_list[:options].any? { |link_item| link_item[:value] == 'story'}).to be_truthy
  end

  it 'test_contains_data_lens_regardless_of_feature_flags' do
    stub_feature_flags_with(:data_lens_transition_state => 'pre_beta')
    view_types_list = @browse_controller.send(:view_types_facet)
    expect(view_types_list[:options].any? { |link_item| link_item[:value] == 'new_view'}).to be_truthy
  end

  it 'test_does_not_add_api_if_using_cetera_search' do
    stub_feature_flags_with(:cetera_search => true)
    view_types_list = @browse_controller.send(:view_types_facet)
    expect(view_types_list[:options].any? { |link_item| link_item[:value] == 'api'}).to be_falsy
  end

  # There was a regression around this
  it 'test_whitelisting_of_view_types_is_respected' do
    whitelisted_view_type_values = %w(datasets charts)
    allow(CurrentDomain).to receive(:property).with(:view_types_facet, :catalog).and_return(whitelisted_view_type_values)

    view_types_facet = @browse_controller.send(:view_types_facet)
    actual_view_type_values = view_types_facet[:options].collect { |vt| vt[:value] }

    expect(whitelisted_view_type_values).to eq(actual_view_type_values)
  end

  # Documenting behavior that is possibly not desired
  it 'test_defined_but_empty_whitelist_allows_no_view_types' do
    allow(CurrentDomain).to receive(:property).with(:view_types_facet, :catalog).and_return([])

    view_types_facet = @browse_controller.send(:view_types_facet)
    actual_view_type_values = view_types_facet[:options].collect { |vt| vt[:value] }

    expect(actual_view_type_values.empty?).to eq(true)
  end

  # Let's make sure this keeps working
  it 'test_standard_view_types_show_up_without_whitelisting' do
    standard_view_types = @browse_controller.send(:standard_view_types)

    view_types_facet = @browse_controller.send(:view_types_facet)
    actual_view_types = view_types_facet[:options]

    expect(standard_view_types.present?).to be_truthy
    standard_view_types.each do |svt|
      expect(actual_view_types.include?(svt)).to be_truthy
    end
  end
end

describe BrowseActions do
  include TestHelperMethods

  before do
    @browse_controller = BrowseController.new

    init_current_domain
    init_feature_flag_signaller

    Canvas2::Util.reset

    allow(CurrentDomain).to receive(:property).and_return({:catalog => {:sortBy => 'relevance'}})

    stub_feature_flags_with(:cetera_search => true)

    allow(APP_CONFIG).to receive(:cetera_internal_uri).and_return('http://cetera.app.aws-us-east-1-fedramp-prod.socrata.net')
  end

  it 'test_do_not_use_cetera_if_cetera_internal_uri_not_present' do
    allow(APP_CONFIG).to receive(:cetera_internal_uri).and_return(nil)
    expect(@browse_controller.send(:using_cetera?)).to be_falsy
  end

  it 'test_do_not_use_cetera_on_admin_datasets' do
    allow(@browse_controller).to receive(:action_name).and_return('datasets')
    allow(@browse_controller).to receive(:controller_name).and_return('administration')
    expect(@browse_controller.send(:using_cetera?)).to be_falsy
  end

  it 'test_do_not_use_cetera_on_admin_views' do
    allow(@browse_controller).to receive(:action_name).and_return('views')
    allow(@browse_controller).to receive(:controller_name).and_return('administration')
    expect(@browse_controller.send(:using_cetera?)).to be_falsy
  end

  it 'test_use_cetera_on_browse' do
    allow(@browse_controller).to receive(:using_cetera?).and_return(true)
    allow_any_instance_of(BrowseController).to receive(:request).and_return(OpenStruct.new(path: '/browse'))
    expect(@browse_controller.send(:using_cetera?)).to be_truthy
  end

  it 'test_use_cetera_on_dataslated_home_browse' do
    allow(@browse_controller).to receive(:using_cetera?).and_return(true)
    allow_any_instance_of(BrowseController).to receive(:request).and_return(OpenStruct.new(path: '/'))
    expect(@browse_controller.send(:using_cetera?)).to be_truthy
  end

  # This is an emergency fix and appropriately heinous
  it 'test_browse_options_for_metadata_facets' do
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

    allow(@browse_controller).to receive(:custom_facets).and_return(custom_facets)
    allow(@browse_controller).to receive(:categories_facet).and_return(nil)
    allow(@browse_controller).to receive(:topics_facet).and_return(nil)
    allow(@browse_controller).to receive(:using_cetera?).and_return(false)
    allow(Federation).to receive(:federations).and_return([])

    allow(CurrentDomain).to receive(:configuration).and_return(nil)
    allow(CurrentDomain).to receive(:default_locale).and_return('en')
    allow(I18n).to receive(:locale).and_return(CurrentDomain.default_locale.to_s)

    allow(Clytemnestra).to receive(:search_views).and_return([])

    field = 'Dataset-Information_Superhero'.to_sym
    value = 'Superman'
    request = OpenStruct.new(:params => { field => value })
    expected = [[field, value].join(':')]

    expect(expected).to eq(@browse_controller.send(:process_browse, request)[:metadata_tag])
  end
end

describe BrowseActions do
  include TestHelperMethods

  before do
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

    allow(CurrentDomain).to receive(:property).and_return({:catalog => {:sortBy => 'relevance'}})
    allow(CurrentDomain).to receive(:configuration).and_return(nil)
    allow(CurrentDomain).to receive(:default_locale).and_return('en')

    stub_feature_flags_with(:cetera_search => true)

    allow(I18n).to receive(:locale).and_return(CurrentDomain.default_locale.to_s)

    @browse_controller = BrowseController.new
    allow(@browse_controller).to receive(:custom_facets).and_return(@test_custom_facets)
    allow(@browse_controller).to receive(:categories_facet).and_return(@test_categories)
    allow(@browse_controller).to receive(:topics_facet).and_return(nil)

    allow(Federation).to receive(:federations).and_return([])
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
    allow(@browse_controller).to receive(:using_cetera?).and_return(true)
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
    allow(@browse_controller).to receive(:using_cetera?).and_return(using_cetera)
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
      expect(browse_options[:search_options].key?(:boostOfficial)).to be_falsy
    else
      expect(expected_boost).to eq(browse_options[:search_options][:boostOfficial])
    end
  end

  it 'test_process_browse_official_boost' do
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
      allow(CurrentDomain).to receive(:property).with(:official_boost, :catalog).and_return(oba)
      cetera_official_boost(uc, bo, oba, eb)
    end
  end

  it 'test_process_browse_unpublished_includes_drafts_if_feature_flag_enabled' do
    stub_feature_flags_with(:ingress_reenter => true)
    allow(@browse_controller).to receive(:using_cetera?).and_return(true)
    request = OpenStruct.new(:params => { category: 'Test Category 4' })
    options = {limitTo: 'unpublished'}
    stub_cetera_for_categories_and_browse(category_4_categories, ['datasets', 'drafts'])
    browse_options = @browse_controller.send(:process_browse, request, options)
    expect(browse_options[:search_options][:limitTo]).to eq(['draft', 'tables'])
  end

  it 'test_process_browse_unpublished_excludes_drafts_if_feature_flag_false' do
    allow(@browse_controller).to receive(:using_cetera?).and_return(true)
    stub_feature_flags_with(:ingress_reenter => false)
    request = OpenStruct.new(:params => { category: 'Test Category 4' })
    options = {limitTo: 'unpublished'}
    stub_cetera_for_categories_and_browse(category_4_categories, 'datasets')
    browse_options = @browse_controller.send(:process_browse, request, options)
    expect(browse_options[:search_options][:limitTo]).to eq('tables')
  end

  it 'test_no_effect_if_cetera_is_not_enabled_and_category_is_present' do
    stub_feature_flags_with(:cetera_search => false)
    cly_unaffected_category = 'Test Category 4'

    stub_request(:get, 'http://localhost:8080/search/views.json?category=Test%20Category%204&limit=10&page=1&sortBy=relevance').
      with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
      to_return(:status => 200, :body => '', :headers => {})

    expected_category = 'Test Category 4'
    stub_core_for_category(expected_category)
    allow(User).to receive(:current_user).and_return(nil)
    expect([expected_category]).to eq(search_and_return_category_param(cly_unaffected_category))
  end

  it 'test_no_effect_if_cetera_is_not_enabled_and_category_is_absent' do
    stub_feature_flags_with(:cetera_search => false)

    stub_core_for_category(nil)

    stub_request(:get, 'http://localhost:8080/search/views.json?limit=10&page=1&sortBy=relevance').
      with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
      to_return(:status => 200, :body => '', :headers => {})

    allow(User).to receive(:current_user).and_return(nil)
    expect(search_and_return_category_param(nil).size).to eq(0)
  end

  it 'test_parent_category_includes_its_children_in_query_to_cetera' do
    stub_cetera_for_categories_and_browse(category_4_categories)
    allow(@browse_controller).to receive(:using_cetera?).and_return(true)

    expect(category_4_categories).to eq(search_and_return_cetera_categories_param('Test Category 4'))
  end

  it 'test_child_category_includes_only_itself_in_query_to_cetera' do
    child_category = 'Test Category 4a'

    expected_categories = [child_category]
    stub_cetera_for_categories_and_browse(expected_categories)
    allow(@browse_controller).to receive(:using_cetera?).and_return(true)

    expect(expected_categories).to eq(search_and_return_cetera_categories_param(child_category))
  end

  it 'test_categories_with_no_children_query_cetera_only_about_themselves' do
    childless_category = 'Business'

    expected_categories = [childless_category]
    stub_cetera_for_categories_and_browse(expected_categories)

    expect(expected_categories).to eq(search_and_return_cetera_categories_param(childless_category))
  end

  it 'test_no_category_results_in_no_category_passed_to_cetera' do
    no_category = nil

    stub_cetera_for_categories_and_browse(expected_categories = nil)

    expect(search_and_return_cetera_categories_param(no_category)).to be_falsy
  end

  it 'test_non_existent_category_gets_magically_injected' do
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
    allow(@browse_controller).to receive(:using_cetera?).and_return(true)

    expect(expected_categories).to eq(search_and_return_cetera_categories_param(imaginary_category))
  end
end

describe BrowseActions do
  include TestHelperMethods

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

  before do
    @browse_controller = BrowseController.new
    init_current_domain
    init_feature_flag_signaller

    Canvas2::Util.reset

    allow(CurrentDomain).to receive(:property).and_return({:catalog => {:sortBy => 'relevance'}})
    allow(CurrentDomain).to receive(:configuration).and_return(nil)
    allow(CurrentDomain).to receive(:default_locale).and_return('en')

    allow(I18n).to receive(:locale).and_return(CurrentDomain.default_locale.to_s)

    allow(Clytemnestra).to receive(:search_views).and_return([])

    allow(Federation).to receive(:federations).and_return([])

    # It's important to have multiple custom facets so we can test that
    # we aren't hardcoding to the 3rd slot regardless
    allow(@browse_controller).to receive(:get_facet_cutoff).and_return(3)
    allow(CurrentDomain).to receive(:property).with(:custom_facets, :catalog).and_return([
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
      allow(@browse_controller).to receive(type_of_facet.to_sym).and_return(facet(name))
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

  it 'test_cly_topics_facet_without_param' do
    allow(@browse_controller).to receive(:topics_facet).and_call_original
    stub_feature_flags_with(:cetera_search => false)
    facets = @browse_controller.send(:topics_facet).with_indifferent_access
    expected_facets = JSON.parse('{"type":"topic","title":"Topics","singular_description":"topic","param":"tags","options":[{"text":"crazy","value":"crazy","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2}],"extra_options":[{"text":"crazy","value":"crazy","count":1},{"text":"keyword","value":"keyword","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2},{"text":"ufo","value":"ufo","count":1},{"text":"weird","value":"weird","count":1}],"tag_cloud":true}').with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    expect(expected_facets).to eq(facets)
  end

  it 'test_cly_topics_facet_with_matching_param' do
    allow(@browse_controller).to receive(:topics_facet).and_call_original
    stub_feature_flags_with(:cetera_search => false)
    facets = @browse_controller.send(:topics_facet, :tags => 'neato').with_indifferent_access
    expected_facets = {"type"=>:topic, "title"=>"Topics", "singular_description"=>"topic", "param"=>:tags, "options"=>[{"text"=>"crazy", "value"=>"crazy", "count"=>1}, {"text"=>"neato", "value"=>"neato", "count"=>0}, {"text"=>"other", "value"=>"other", "count"=>2}, {"text"=>"tag", "value"=>"tag", "count"=>2}], "extra_options"=>[{"text"=>"crazy", "value"=>"crazy", "count"=>1}, {"text"=>"keyword", "value"=>"keyword", "count"=>1}, {"text"=>"neato", "value"=>"neato", "count"=>1}, {"text"=>"other", "value"=>"other", "count"=>2}, {"text"=>"tag", "value"=>"tag", "count"=>2}, {"text"=>"ufo", "value"=>"ufo", "count"=>1}, {"text"=>"weird", "value"=>"weird", "count"=>1}], "tag_cloud"=>true}.with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    expect(expected_facets).to eq(facets)
  end

  it 'test_cly_topics_facet_with_non_matching_param' do
    allow(@browse_controller).to receive(:topics_facet).and_call_original
    stub_feature_flags_with(:cetera_search => false)
    expected_facets = JSON.parse('{"type":"topic","title":"Topics","singular_description":"topic","param":"tags","options":[{"text":"crazy","value":"crazy","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2}],"extra_options":[{"text":"crazy","value":"crazy","count":1},{"text":"keyword","value":"keyword","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2},{"text":"ufo","value":"ufo","count":1},{"text":"weird","value":"weird","count":1}],"tag_cloud":true}').with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    facets = @browse_controller.send(:topics_facet, :tags => 'unknown').with_indifferent_access
    expected_facets['options'] = facets['options'].push('text' => 'unknown', 'value' => 'unknown', 'count' => 0)
    expect(expected_facets).to eq(facets)
  end

  it 'test_cetera_topics_facet_without_param' do
    allow(@browse_controller).to receive(:topics_facet).and_call_original
    stub_feature_flags_with(:cetera_search => true)
    facets = @browse_controller.send(:topics_facet).with_indifferent_access
    expected_facets = JSON.parse('{"type":"topic","title":"Tags","singular_description":"tag","param":"tags","options":[{"text":"crazy","value":"crazy","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2}],"extra_options":[{"text":"crazy","value":"crazy","count":1},{"text":"keyword","value":"keyword","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2},{"text":"ufo","value":"ufo","count":1},{"text":"weird","value":"weird","count":1}],"tag_cloud":true}').with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    expect(expected_facets).to eq(facets)
  end

  it 'test_cetera_topics_facet_with_matching_param' do
    allow(@browse_controller).to receive(:topics_facet).and_call_original
    stub_feature_flags_with(:cetera_search => true)
    facets = @browse_controller.send(:topics_facet, :tags => 'neato').with_indifferent_access
    expected_facets = {"type"=>:topic, "title"=>"Tags", "singular_description"=>"tag", "param"=>:tags, "options"=>[{"text"=>"crazy", "value"=>"crazy", "count"=>1}, {"text"=>"neato", "value"=>"neato", "count"=>0}, {"text"=>"other", "value"=>"other", "count"=>2}, {"text"=>"tag", "value"=>"tag", "count"=>2}], "extra_options"=>[{"text"=>"crazy", "value"=>"crazy", "count"=>1}, {"text"=>"keyword", "value"=>"keyword", "count"=>1}, {"text"=>"neato", "value"=>"neato", "count"=>1}, {"text"=>"other", "value"=>"other", "count"=>2}, {"text"=>"tag", "value"=>"tag", "count"=>2}, {"text"=>"ufo", "value"=>"ufo", "count"=>1}, {"text"=>"weird", "value"=>"weird", "count"=>1}], "tag_cloud"=>true}.with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    expect(expected_facets).to eq(facets)
  end

  it 'test_cetera_topics_facet_with_non_matching_param' do
    allow(@browse_controller).to receive(:topics_facet).and_call_original
    stub_feature_flags_with(:cetera_search => true)
    facets = @browse_controller.send(:topics_facet, :tags => 'unknown').with_indifferent_access
    expected_facets = JSON.parse('{"type":"topic","title":"Tags","singular_description":"tag","param":"tags","options":[{"text":"crazy","value":"crazy","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2}],"extra_options":[{"text":"crazy","value":"crazy","count":1},{"text":"keyword","value":"keyword","count":1},{"text":"neato","value":"neato","count":1},{"text":"other","value":"other","count":2},{"text":"tag","value":"tag","count":2},{"text":"ufo","value":"ufo","count":1},{"text":"weird","value":"weird","count":1}],"tag_cloud":true}').with_indifferent_access
    expected_facets[:type] = expected_facets.delete(:type).to_sym
    expected_facets[:param] = expected_facets.delete(:param).to_sym # Hack because using JSON for fixture data
    expected_facets['options'] = facets['options'].push('text' => 'unknown', 'value' => 'unknown', 'count' => 0)
    expect(expected_facets).to eq(facets)
  end

  it 'test_categories_come_first_in_new_catalog' do
    allow(@browse_controller).to receive(:topics_facet).and_call_original
    stub_feature_flags_with('cetera_search' => true)
    request = OpenStruct.new(params: { cetera_search: 'true' }.with_indifferent_access)
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
      expect(expected).to eq(actual)
    end
  end

  it 'test_categories_come_third_in_old_view_types' do
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
      expect(expected).to eq(actual)
    end
  end

  it 'test_categories_facet_works_nil_extra_options' do
    request = OpenStruct.new(params: { category: 'Some Random Category' }.with_indifferent_access)

    # Let's have nil for extra options
    allow(@browse_controller).to receive(:categories_facet).and_return(facet('categories').merge(extra_options: nil))
    browse_options = @browse_controller.send(:process_browse, request)
    cat_facet = browse_options[:facets].find { |f| f[:title] == 'Categories' }
    expect(cat_facet[:extra_options]).to be_falsy # make sure the test setup worked

    # This used to raise a TypeError as per EN-760
    res = @browse_controller.send(:selected_category_and_any_children, browse_options)
    expect(res).to eq(['Some Random Category'])
  end

  it 'test_custom_facets_respect_facet_cutoff_when_nothing_is_selected' do
    request = OpenStruct.new(params: {}.with_indifferent_access)

    # NOTE: Setting facet_cutoff to 0 has inconsistent behavior across facets
    (1..10).each do |cutoff|
      allow(@browse_controller).to receive(:get_facet_cutoff).and_return(cutoff)
      expect(cutoff).to eq(@browse_controller.send(:get_facet_cutoff, :custom))

      browse_options = @browse_controller.send(:process_browse, request)
      facet = browse_options[:facets].find { |o| o[:param] == :'custom superheroes' }

      expected_options_size = [cutoff, 6].min # can't have more options than exist
      expect(expected_options_size).to eq(facet[:options].size)
      expect(6 - expected_options_size).to eq(facet[:extra_options].to_a.size)
    end
  end

  it 'test_custom_facets_always_show_selected_option_above_fold' do
    facet_name = 'custom superheroes'
    facet_value = 'Six'
    request = OpenStruct.new(
      params: { facet_name => facet_value }.with_indifferent_access
    )

    # NOTE: Setting facet_cutoff to 0 has inconsistent behavior across facets
    (1..10).each do |cutoff|
      allow(@browse_controller).to receive(:get_facet_cutoff).and_return(cutoff)
      browse_options = @browse_controller.send(:process_browse, request)

      facet = browse_options[:facets].find { |o| o[:param] == facet_name.to_sym }
      options = facet[:options]
      extra_options = facet[:extra_options].to_a # extra_options can be missing/nil

      # cutoff + 1 because we append our selected option
      # min because we can't have more visibile options than exist
      expected_options_size = [cutoff + 1, 6].min
      expect(expected_options_size).to eq(options.size)

      # Make sure our selected option is showing up only once
      expect(1).to eq((options + extra_options).count { |o| o['value'] == facet_value })

      # Make sure we have the right number of extra (hidden) options
      expect(6 - expected_options_size).to eq(extra_options.size)

      expect(facet_value).to eq(options.last['value'])
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
    allow(CurrentDomain).to receive(:property).with(:custom_facets, :catalog).and_return(custom_facets_catalog)
    allow(@browse_controller).to receive(:get_facet_cutoff).and_return(cutoff)
    browse_options = @browse_controller.send(:process_browse, OpenStruct.new(params: {}))

    # We go in as a Hashie::Mash but come back as a normal hash
    facet = browse_options[:facets].find { |fct| fct[:title] == 'Superhero' }
    [facet[:options], facet[:extra_options]]
  end

  def expected_partitions
    # Make sure our setup is what we expect
    options = custom_facets_catalog.first.options
    expect(3).to eq(options.count(&:summary))
    expect(5).to eq(options.count)

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

  it 'test_custom_facet_partitioning_with_summary_true' do
    expected_partitions.each do |(cutoff, expected)|
      options, extra_options = process_custom_facets_catalog(cutoff)

      expect(expected[:option_texts]).to eq(options.pluck('text'))

      expect(expected[:extra_option_texts]).to eq(extra_options.to_a.pluck('text'))
    end
  end
end
