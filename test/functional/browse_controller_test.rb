require 'test_helper'

class BrowseControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    @user = login
    init_stubs
  end

  # LOL! Stub all the things!!
  def init_stubs
    @user.stubs(
      :followers => [],
      :friends => [],
      :route_params => {
        :profile_name => @user.screen_name,
        :id => @user.uid
      },
      :rights => []
    )
    User.stubs(:find_profile => @user)
    @controller.stubs(
      :current_user => @user,
      :categories_facet => nil
    )
    connection_stub = stub.tap do |stub|
      stub.stubs(
        :batch_request => [],
        :get_request => File.open('test/fixtures/catalog_search_results.json').read,
        :reset_counters => {
          :runtime => 0,
          :requests => {}
        }
      )
    end
    Configuration.stubs(:find_by_type => {})
    CoreServer::Base.stubs(:connection => connection_stub)
    Tag.stubs(:find => [])
    Federation.stubs(:find => [])
  end

  test 'it should respond to the data_lens_state feature flag as a query string parameter' do
    stub_feature_flags_with(:data_lens_transition_state, 'pre_beta')
    get :show, { 'data_lens_transition_state' => 'post_beta' }

    assert_response :success
    assert_select_quiet '.facetSection.limitTo > ul > li > .typeDataLens', 1
  end

  test 'it should render page meta content over https and not http' do
    @request.env['HTTPS'] = 'on'
    get :show
    assert_select_quiet 'meta' do |elements|
      elements.each do |element|
        element.attributes.values.each do |value|
          value.to_s.scan(/http.?:\/\//).each do |match|
            assert_equal(match, 'https://')
          end
        end
      end
    end
  end

  context 'when the data_lens_state feature flag is set to "pre_beta"' do
    setup do
      stub_feature_flags_with(:data_lens_transition_state, 'pre_beta')
    end

    should 'not show any new view facet for users unable to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => []
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeDataLens', 0
    end

    should 'not show any new view facet for users able to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => [UserRights::EDIT_OTHERS_DATASETS]
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeDataLens', 0
    end
  end

  context 'when the data_lens_state feature flag is set to "beta"' do
    setup do
      stub_feature_flags_with(:data_lens_transition_state, 'beta')
    end

    should 'not show any new view facet for users unable to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => []
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeDataLens', 0
    end

    should 'show new view facets for users able to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => [UserRights::EDIT_OTHERS_DATASETS]
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeDataLens', 1
    end
  end

  context 'when the data_lens_state feature flag is set to "post_beta"' do
    setup do
      stub_feature_flags_with(:data_lens_transition_state, 'post_beta')
    end

    should 'show new view facets for users unable to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => []
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeDataLens', 1
    end

    should 'show new view facets for users able to edit the datasets of others' do
      @user.stubs(
        :followers => [],
        :friends => [],
        :route_params => {
          :profile_name => @user.screen_name,
          :id => @user.uid
        },
        :rights => [UserRights::EDIT_OTHERS_DATASETS]
      )
      @controller.stubs(
        :current_user => @user,
        :categories_facet => nil
      )
      get :show

      assert_response :success
      assert_select_quiet '.facetSection.limitTo > ul > li > .typeDataLens', 1
    end
  end

  test 'it should not send a limitTo for search when no facet is selected' do
    Clytemnestra.
      expects(:search_views).
      with() { |actual| !actual[:limitTo].present? }.
      returns(Clytemnestra::ViewSearchResult.from_result(File.open('test/fixtures/catalog_search_results.json').read))
    get :show
    assert_response :success
    Clytemnestra.unstub(:search_views)
  end

  test 'it should send an appropriate limitTo for search when new_view type facet is selected' do
    Clytemnestra.
      expects(:search_views).
      with() { |actual| actual[:limitTo].eql? 'new_view' }.
      returns(Clytemnestra::ViewSearchResult.from_result(File.open('test/fixtures/catalog_search_results.json').read))
    get :show, { 'limitTo' => 'new_view' }
    assert_response :success
    Clytemnestra.unstub(:search_views)
  end

  context 'embedded browse page' do
    should 'render without errors' do
      get :embed
      assert_response :success
    end

    should 'render without errors when custom facets is nil' do
      BrowseActions.stubs(custom_facets: nil)
      get :embed
      assert_response :success
    end

    should 'render without errors when custom facets is []' do
      BrowseActions.stubs(custom_facets: [])
      get :embed
      assert_response :success
    end
  end

  # These tests make sure that both Core/Cly and Cetera get the correct query
  # params whether from /browse or from /browse/embed
  # See EN-3164 and EN-3131
  context 'browse and embedded facets and sort' do
    # These would be passed in to Rails from the url on a user's browser
    front_end_url_params = {
      'Dataset-Information_Superhero' => 'Batman',
      'category' => 'Public+Safety', # category gets correct url encoding
      'federation_filter' => '1',
      'limitTo' => 'datasets',
      'q' => 'pale%20moonlight', # q space can be %20 or + depending on when it was entered
      'sortBy' => 'relevance',
      'tags' => 'crime',
      'utf8' => '%E2%9C%93'
    }

    # The FE params should be translated like so when being sent to Core/Cly
    core_cly_params = {
      'category' => 'Public+Safety', # category gets correct url encoding
      'datasetView' => 'dataset',
      'federation_filter' => '1',
      'limit' => 10,
      'limitTo' => 'tables',
      'metadata_tag' => ['Dataset-Information_Superhero:Batman'],
      'page' => 1,
      'q' => 'pale%20moonlight', # q space can be %20 or + depending on when it was entered
      'sortBy' => 'relevance',
      'tags' => 'crime'
    }.symbolize_keys

    default_core_cly_params = {
      limit: 10,
      page: 1
    }

    # The FE params should be translated like so when being sent to Cetera
    cetera_params = {
      'Dataset-Information_Superhero' => 'Batman',
      :boostDomains => { 'performance.seattle.gov' => 0.8 },
      :categories => ['Public+Safety'],
      :domains => 'data.seattle.gov',
      :limit => 10,
      :offset => 0,
      :only => 'datasets',
      :order => 'relevance',
      :q => 'pale%20moonlight', # q space can be %20 or + depending on when it was entered
      :search_context => 'data.seattle.gov',
      :tags => 'crime'
    }

    default_cetera_params = {
      domains: 'localhost',
      limit: 10,
      offset: 0,
      order: 'relevance',
      search_context: 'localhost'
    }

    # NOTE: this is an Array of Hashie::Mash, unlike other facets
    custom_facets = [
      Hashie::Mash.new(
        'singular_description' => 'superhero',
        'title' => 'Superhero',
        'param' => 'Dataset-Information_Superhero',
        'options' => [
          { 'summary' => false, 'text' => 'Superman', 'value' => 'Superman' },
          { 'summary' => false, 'text' => 'Batman', 'value' => 'Batman' },
          { 'summary' => false, 'text' => 'Flash', 'value' => 'Flash' },
          { 'summary' => false, 'text' => 'Spiderman', 'value' => 'Spiderman' },
          { 'summary' => false, 'text' => 'Hulk', 'value' => 'Hulk' }
        ]
      )
    ]

    # Let's actually render the categories facet from the site config
    view_category_tree = {
      '' => { text: '-- No category --', value: '' },
      'City Business' => {
        children:
          [{ value: 'Community', text: 'Community' }, { value: 'Education', text: 'Education' }],
        value: 'City Business', text: 'City Business'
      },
      'Finance' => { value: 'Finance', text: 'Finance' },
      'Health & Human Services' =>
        { value: 'Health & Human Services', text: 'Health & Human Services' },
      'Public Safety' => { value: 'Public Safety', text: 'Public Safety' },
      'Community & Economic Development' => {
        value: 'Community & Economic Development', text: 'Community & Economic Development'
      },
      'Service Requests' => { value: 'Service Requests', text: 'Service Requests' }
    }

    # Cetera needs to call out to Core to look up Federation IDs
    federations_stub = [
      Hashie::Mash.new(
        'id' => 2,
        'acceptedUserId' => 2,
        'acceptorScreenName' => 'Somebody Who',
        'lensName' => '',
        'providerScreenName' => 'Somebody Who',
        'searchBoost' => 0.8,
        'sourceDomainCName' => 'performance.seattle.gov',
        'sourceDomainId' => 3,
        'targetDomainCName' => 'data.seattle.gov',
        'targetDomainId' => 1,
        'flags' => []
      )
    ]

    clytemnestra_payload = File.read('test/fixtures/catalog_search_results.json')
    cetera_payload = File.read('test/fixtures/cetera_search_results.json')

    stubbed_custom_cutoff = 3

    setup do
      # let's actually test the categories facet
      @controller.unstub(:categories_facet)
      View.expects(:category_tree).returns(view_category_tree)

      CurrentDomain.expects(:property).with(:custom_facets, :catalog).returns(custom_facets).twice
      CurrentDomain.expects(:property).with(:facet_cutoffs, :catalog).returns('custom' => stubbed_custom_cutoff)
      CurrentDomain.expects(:property).with(:view_types_facet, :catalog).returns(nil)
    end

    teardown do
      CurrentDomain.unstub(:property)
      View.unstub(:category_tree)
    end

    should 'send correct facet params to Core Cly with browse' do
      Clytemnestra.
        expects(:search_views).
        with(core_cly_params).
        returns(Clytemnestra::ViewSearchResult.from_result(clytemnestra_payload))

      get(:show, front_end_url_params)
      assert_response :success
      assert_match(/This is my new view blah blah blah/, @response.body)
      assert_match(/Newest/, @response.body) # sort order

      Clytemnestra.unstub(:search_views)
    end

    should 'send correct facet params to Core Cly with embed' do
      Clytemnestra.
        expects(:search_views).
        with(core_cly_params).
        returns(Clytemnestra::ViewSearchResult.from_result(clytemnestra_payload))

      get(:embed, front_end_url_params)
      assert_response :success
      assert_match(/This is my new view blah blah blah/, @response.body)
      assert_match(/Recently Updated/, @response.body) # sort order

      Clytemnestra.unstub(:search_views)
    end

    should 'send correct facet params to Cetera with browse' do
      # Cetera will abort if Federation ids don't check out
      Federation.expects(:federations).returns(federations_stub).twice # We should cache this
      CurrentDomain.stubs(:cname).returns('data.seattle.gov') # for Cetera

      stub_feature_flags_with(:cetera_search, true)
      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1'). # TODO: update when moving to v2
        with(query: cetera_params).
        to_return(status: 200, body: cetera_payload, headers: {})

      get(:show, front_end_url_params)
      assert_response :success
      assert_match(/Sold Fleet Equipment/, @response.body)
      assert_match(/Most Relevant/, @response.body) # sort order

      CurrentDomain.unstub(:cname)
    end

    should 'send correct facet params to Cetera with embed' do
      # Cetera will abort if Federation ids don't check out
      Federation.expects(:federations).returns(federations_stub).twice # We should cache this
      CurrentDomain.stubs(:cname).returns('data.seattle.gov') # for Cetera

      stub_feature_flags_with(:cetera_search, true)
      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: cetera_params).
        to_return(status: 200, body: cetera_payload, headers: {})

      get(:embed, front_end_url_params)
      assert_response :success
      assert_match(/Sold Fleet Equipment/, @response.body)
      assert_match(/Most Accessed/, @response.body) # sort order

      CurrentDomain.unstub(:cname)
    end

    ##################################################################
    # Let's check default paths just to make sure we don't break these

    should 'send correct default params to Core with embed' do
      CoreServer::Base.unstub(:connection) # stubbed willy nilly
      stub_request(:get, APP_CONFIG.coreservice_uri + '/search/views.json').
        with(query: default_core_cly_params).
        to_return(status: 200, body: clytemnestra_payload, headers: {})
      get(:embed, {})
      assert_response :success
      assert_match(/This is my new view blah blah blah/, @response.body)
      assert_match(/Most Relevant/, @response.body) # sort order
    end

    should 'send correct default params to Core with browse' do
      CoreServer::Base.unstub(:connection) # stubbed willy nilly
      stub_request(:get, APP_CONFIG.coreservice_uri + '/search/views.json').
        with(query: default_core_cly_params).
        to_return(status: 200, body: clytemnestra_payload, headers: {})
      get(:show, {})
      assert_response :success
      assert_match(/This is my new view blah blah blah/, @response.body)
      assert_match(/Most Accessed/, @response.body) # sort order
    end

    should 'send default params to Cetera with embed' do
      stub_feature_flags_with(:cetera_search, true)
      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: default_cetera_params).
        to_return(status: 200, body: cetera_payload, headers: {})

      get(:embed, {})
      assert_response :success
      assert_match(/Sold Fleet Equipment/, @response.body)
      assert_match(/Newest/, @response.body) # sort order
    end

    should 'send default params to Cetera with browse' do
      stub_feature_flags_with(:cetera_search, true)
      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: default_cetera_params).
        to_return(status: 200, body: cetera_payload, headers: {})

      get(:show, {})
      assert_response :success
      assert_match(/Sold Fleet Equipment/, @response.body)
      assert_match(/Recently Updated/, @response.body) # sort order
    end

    # See EN-3383
    should 'truncate custom cutoffs as configured' do
      stub_feature_flags_with(:cetera_search, true)
      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: default_cetera_params, headers: { 'Accept' => '*/*', 'User-Agent' => 'Ruby' }).
        to_return(status: 200, body: cetera_payload, headers: {})

      get(:show, {})
      assert_response :success

      visible = custom_facets.first['options'].map { |opt| opt['text'] }.first(stubbed_custom_cutoff)
      def visible_selector(index)
        [
          'div.browseFacets',
          'div.facetSection.clearfix.Dataset-Information_Superhero',
          'ul',
          "li:nth-child(#{index})",
          'a'
        ].join(' > ')
      end

      truncated = custom_facets.first['options'].map { |opt| opt['text'] }[stubbed_custom_cutoff..-1]
      def truncated_selector(index)
        [
          'div.browseFacets',
          'div.facetSection.clearfix.Dataset-Information_Superhero',
          'div',
          "a:nth-child(#{index})"
        ].join(' > ')
      end

      visible.each_with_index do |text, index|
        assert_select_quiet visible_selector(index + 1)
      end

      truncated.each_with_index do |text, index|
        assert_select_quiet truncated_selector(index + 1)
      end
    end
  end

  #########################################################################
  # Let's test some failure cases. If Core is down, sure, we're hosed.
  # But, if just Cly or Cetera is down or slow, we should at least timeout.
  # It's important not to let FE requests get backed up.

  context 'browse' do
    setup do
      CurrentDomain.stubs(:cname).returns('example.com')
    end

    ########
    # Cetera

    cetera_selector = 'div.browse2-mobile-filter-header > div'
    cetera_message = '0 Results' # browse2 does not disambiguate between failure and no results

    should 'fail gracefully on Cetera timeout' do
      stub_feature_flags_with(:cetera_search, true)

      cetera_params = Cetera.cetera_soql_params(
        domains: ['example.com'], search_context: 'example.com', limit: 10
      )

      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: cetera_params).
        to_timeout

      # Cetera should be paired with browse2
      get(:show, view_type: 'browse2')
      assert_response :success

      assert_select cetera_selector, cetera_message
    end

    should 'fail gracefully on Cetera 500' do
      stub_feature_flags_with(:cetera_search, true)

      cetera_params = Cetera.cetera_soql_params(
        domains: ['example.com'],
        search_context: 'example.com',
        limit: 10
      )

      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: cetera_params).
        to_return(status: 500)

      get(:show, view_type: 'browse2')
      assert_response :success

      assert_select cetera_selector, cetera_message
    end

    should 'fail gracefully on Cetera unexpected payload' do
      stub_feature_flags_with(:cetera_search, true)

      cetera_params = Cetera.cetera_soql_params(
        domains: ['example.com'],
        search_context: 'example.com',
        limit: 10
      )

      stub_request(:get, APP_CONFIG.cetera_host + '/catalog/v1').
        with(query: cetera_params).
        to_return(status: 200, body: 'oh no they were ready for that!')

      get(:show, view_type: 'browse2')
      assert_response :success

      assert_select cetera_selector, cetera_message
    end

    ##########
    # Core/Cly

    core_cly_selector = 'div.browseList > div.results > div > span'
    core_cly_message = # old browse has a helpful message indicating search is unavailable
      'We&#x27;re sorry. Results could not be retrieved at this time. Please try again later.'

    should 'fail gracefully on Core/Cly timeout' do
      stub_feature_flags_with(:cetera_search, false)
      CoreServer::Base.unstub(:connection) # we stubbed all the things

      stub_request(:get, APP_CONFIG.coreservice_uri + '/search/views.json').
        with(query: { limit: 10, page: 1 }, headers: { 'X-Socrata-Host' => 'example.com' }).
        to_timeout

      get(:show, {})
      assert_response :success

      assert_select core_cly_selector, core_cly_message
    end

    should 'fail gracefully on Core/Cly 500' do
      stub_feature_flags_with(:cetera_search, false)
      CoreServer::Base.unstub(:connection)

      stub_request(:get, APP_CONFIG.coreservice_uri + '/search/views.json').
        with(query: { limit: 10, page: 1 }, headers: { 'X-Socrata-Host' => 'example.com' }).
        to_return(status: 500)

      get(:show, {})
      assert_response :success

      assert_select core_cly_selector, core_cly_message
    end

    should 'fail gracefully on Core/Cly unexpected payload' do
      stub_feature_flags_with(:cetera_search, false)
      CoreServer::Base.unstub(:connection)

      stub_request(:get, APP_CONFIG.coreservice_uri + '/search/views.json').
        with(query: { limit: 10, page: 1 }, headers: { 'X-Socrata-Host' => 'example.com' }).
        to_return(status: 200, body: 'core has been deprecated')

      get(:show, {})
      assert_response :success

      assert_select core_cly_selector, core_cly_message
    end
  end
end
