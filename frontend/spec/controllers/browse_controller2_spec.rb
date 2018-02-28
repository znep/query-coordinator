require 'rails_helper'

# This file is a port of the MiniTest file that was contemporaneous with the
# RSpec file for the same class, for some reason. It was deemed easier to have a
# second test file than to merge the two files into one.

describe BrowseController do
  include TestHelperMethods

  render_views

  let(:catalog_endpoint) { "#{APP_CONFIG.cetera_internal_uri}/catalog/v1" }
  let(:view_search_endpoint) { "#{APP_CONFIG.coreservice_uri}/search/views.json" }
  let(:viz_params) do
    {
      :public => true,
      :published => true,
      :approval_status => 'approved',
      :explicitly_hidden => false
    }
  end

  before do
    init_current_domain
    stub_site_chrome
    init_feature_flag_signaller

    allow(Configuration).to receive(:find_by_type).and_return({})
    allow(Federation).to receive(:find).and_return([])
    allow(Tag).to receive(:find).and_return([])
  end

  describe 'regarding Datalenses, regardless of feature flags' do
    it 'shows the Datalens facet for users unable to edit the datasets of others' do
      user = double(User)
      allow(user).to receive(:has_right?).and_return(false)

      allow(controller).to receive(:current_user).and_return(user)

      get :show

      expect(response).to have_http_status(:ok)
      assert_select('.facetSection.limitTo > ul > li > .typeDataLens', 1)
    end

    it 'shows the Datalens facet for users able to edit the datasets of others' do
      user = double(User)
      allow(user).to receive(:has_right?).and_return(true)

      allow(controller).to receive(:current_user).and_return(user)

      get :show

      expect(response).to have_http_status(:ok)
      assert_select('.facetSection.limitTo > ul > li > .typeDataLens', 1)
    end
  end

  describe 'limitTo' do
    let(:view_search_result) do
      double(Clytemnestra::ViewSearchResult, count: 1, results: [])
    end

    before do
      stub_feature_flags_with(:cetera_search => false)
    end

    it 'does not send a limitTo for search when no facet is selected' do
      expect(Clytemnestra).to receive(:search_views).
        with(hash_excluding(:limitTo)).
        and_return(view_search_result)

      get :show

      expect(response).to have_http_status(:ok)
    end

    it 'does send a limitTo for search when a facet is selected' do
      expect(Clytemnestra).to receive(:search_views).
        with(hash_including(limitTo: 'new_view')).
        and_return(view_search_result)

      get :show, { 'limitTo' => 'new_view' }

      expect(response).to have_http_status(:ok)
    end
  end

  context 'embedded browse page' do
    before do
      stub_feature_flags_with(:cetera_search => false)
    end

    it 'should render without errors' do
      get :embed

      assert_response(:success)
    end

    it 'should render without errors when custom facets is nil' do
      allow(controller).to receive(:custom_facets).and_return(nil)

      get :embed

      assert_response(:success)
    end

    it 'should render without errors when custom facets is []' do
      allow(controller).to receive(:custom_facets).and_return([])

      get :embed

      assert_response(:success)
    end
  end

  # These tests make sure that both Core/Cly and Cetera get the correct query
  # params whether from /browse or from /browse/embed
  # See EN-3164 and EN-3131
  describe 'browse and embedded facets and sort' do
    # These would be passed in to Rails from the url on a user's browser
    let(:front_end_url_params) do
      {
        'Dataset-Information_Superhero' => 'Batman',
        'category' => 'Public+Safety', # category gets correct url encoding
        'federation_filter' => '1',
        'limitTo' => 'datasets',
        'q' => 'pale%20moonlight', # q space can be %20 or + depending on when it was entered
        'sortBy' => 'relevance',
        'tags' => 'crime',
        'utf8' => '%E2%9C%93'
      }
    end

    # The FE params should be translated like so when being sent to Core/Cly
    let(:core_cly_params) do
      {
        'category' => 'Public+Safety', # category gets correct url encoding
        'datasetView' => 'dataset',
        'federation_filter' => '1',
        'limit' => 10,
        'limitTo' => 'tables',
        'metadata_tag' => ['Dataset-Information_Superhero:Batman'],
        'page' => 1,
        'q' => 'pale%20moonlight', # q space can be %20 or + depending on when it was entered
        'sortBy' => 'relevance',
        'tags' => 'crime',
        'options' => []
      }.symbolize_keys
    end

    let(:default_core_cly_params) do
      { limit: 10, page: 1 }
    end

    # The FE params should be translated like so when being sent to Cetera
    let(:cetera_params) do
      {
        'Dataset-Information_Superhero' => 'Batman',
        :boostDomains => { 'performance.example.com' => 0.8 },
        :categories => ['Public+Safety'],
        :domains => 'example.com',
        :limit => 10,
        :offset => 0,
        :only => 'datasets',
        :order => 'relevance',
        :q => 'pale%20moonlight', # q space can be %20 or + depending on when it was entered
        :search_context => 'example.com',
        :tags => 'crime'
      }.merge(viz_params)
    end

    let(:default_cetera_params) do
      {
        domains: 'localhost',
        limit: 10,
        offset: 0,
        order: 'relevance',
        search_context: 'localhost'
      }.merge(viz_params)
    end

    let(:cetera_headers) do
      { 'Content-Type' => 'application/json', 'X-Socrata-Requestid' => '' }
    end

    # NOTE: this is an Array of Hashie::Mash, unlike other facets
    let(:custom_facets) do
      [
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
    end

    # Let's actually render the categories facet from the site config
    let(:view_category_tree) do
      {
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
    end

    # Cetera needs to call out to Core to look up Federation IDs
    let(:federations_stub) do
      [Hashie::Mash.new(
        'id' => 2,
        'acceptedUserId' => 2,
        'acceptorScreenName' => 'Somebody Who',
        'lensName' => '',
        'providerScreenName' => 'Somebody Who',
        'searchBoost' => 0.8,
        'sourceDomainCName' => 'performance.example.com',
        'sourceDomainId' => 3,
        'targetDomainCName' => 'example.com',
        'targetDomainId' => 1,
        'flags' => []
      )]
    end

    let(:stubbed_custom_cutoff) { 3 }

    let(:view_search_result) do
      Clytemnestra::ViewSearchResult.from_result(clytemnestra_payload)
    end

    let(:stub_catalog_response) do
      {
        status: 200,
        body: cetera_payload,
        headers: { 'Content-Type': 'application/json' }
      }
    end

    before do
      stub_feature_flags_with(:cetera_search => false)

      expect(View).to receive(:category_tree).and_return(view_category_tree)

      expect(CurrentDomain).to receive(:property).
        with(:custom_facets, :catalog).
        and_return(custom_facets).at_most(:twice)

      expect(CurrentDomain).to receive(:property).
        with(:facet_cutoffs, :catalog).
        and_return('custom' => stubbed_custom_cutoff).at_most(20).times

      expect(CurrentDomain).to receive(:property).
        with(:view_types_facet, :catalog).
        and_return(nil).at_most(:twice)

      expect(CurrentDomain).to receive(:property).
        with(:sortBy, :catalog).
        and_return('relevance').at_most(:twice)
    end

    it 'should send correct facet params to Core Cly with browse' do
      expect(Clytemnestra).to receive(:search_views).
        with(core_cly_params).
        and_return(view_search_result)

      get :show, front_end_url_params

      expect(response).to have_http_status(:ok)
      expect(response.body).to match(/This is my new view blah blah blah/)
      expect(response.body).to match(/Newest/) # sort order
    end

    it 'should send correct facet params to Core Cly with embed' do
      expect(Clytemnestra).to receive(:search_views).
        with(core_cly_params).
        and_return(view_search_result)

      get :embed, front_end_url_params

      expect(response).to have_http_status(:ok)
      expect(response.body).to match(/This is my new view blah blah blah/)
      expect(response.body).to match(/Recently Updated/) # sort order
    end

    it 'should send correct facet params to Cetera with browse' do
      # Cetera will abort if Federation ids don't check out
      allow(Federation).to receive(:federations).and_return(federations_stub).twice
      allow(CurrentDomain).to receive(:cname).and_return('example.com') # for Cetera

      stub_feature_flags_with(:cetera_search => true)
      stub_request(:get, catalog_endpoint).
        with(query: cetera_params, headers: cetera_headers).
        to_return(stub_catalog_response)

      get :show, front_end_url_params

      expect(response).to have_http_status(:ok)
      expect(response.body).to match(/Sold Fleet Equipment/)
      expect(response.body).to match(/Most Relevant/) # sort order
    end

    it 'should send correct facet params to Cetera with embed' do
      # Cetera will abort if Federation ids don't check out
      allow(Federation).to receive(:federations).and_return(federations_stub).twice
      allow(CurrentDomain).to receive(:cname).and_return('example.com') # for Cetera

      stub_feature_flags_with(:cetera_search => true)
      stub_request(:get, catalog_endpoint).
        with(query: cetera_params, headers: cetera_headers).
        to_return(stub_catalog_response)

      get :embed, front_end_url_params

      expect(response).to have_http_status(:ok)
      expect(response.body).to match(/Sold Fleet Equipment/)
      expect(response.body).to match(/Most Accessed/) # sort order
    end

    ##################################################################
    # Let's check default paths just to make sure we don't break these

    it 'should send correct default params to Core with embed' do
      expect(Clytemnestra).to receive(:search_views).
        with(hash_including(default_core_cly_params)).
        and_return(view_search_result)

      get :embed

      expect(response).to have_http_status(:ok)
      expect(response.body).to match(/This is my new view blah blah blah/)
      expect(response.body).to match(/Most Relevant/) # sort order
    end

    it 'should send correct default params to Core with browse' do
      expect(Clytemnestra).to receive(:search_views).
        with(hash_including(default_core_cly_params)).
        and_return(view_search_result)

      get :show

      expect(response).to have_http_status(:ok)
      expect(response.body).to match(/This is my new view blah blah blah/)
      expect(response.body).to match(/Most Accessed/) # sort order
    end

    it 'should send default params to Cetera with embed' do
      stub_feature_flags_with(:cetera_search => true)
      stub_request(:get, catalog_endpoint).
        with(query: default_cetera_params, headers: cetera_headers).
        to_return(status: 200, body: cetera_payload, headers: { 'Content-Type': 'application/json' })

      get :embed

      expect(response).to have_http_status(:ok)
      expect(response.body).to match(/Sold Fleet Equipment/)
      expect(response.body).to match(/Recently Added/) # 'Newest' is now 'Recently Added'
      expect(response.body).to match(/Created/) # created_at timestamp shows with 'Recently Added'
    end

    it 'should send default params to Cetera with browse' do
      stub_feature_flags_with(:cetera_search => true)
      stub_request(:get, catalog_endpoint).
        with(query: default_cetera_params, headers: cetera_headers).
        to_return(status: 200, body: cetera_payload, headers: { 'Content-Type': 'application/json' })

      get :show

      expect(response).to have_http_status(:ok)
      expect(response.body).to match(/Sold Fleet Equipment/)
      expect(response.body).to match(/Recently Updated/) # sort order
      expect(response.body).to match(/Updated/) # sort order
    end

    # See EN-3383
    it 'should truncate custom cutoffs as configured' do
      stub_feature_flags_with(:cetera_search => false)
      stub_request(:get, catalog_endpoint).
        with(query: default_cetera_params, headers: cetera_headers).
        to_return(status: 200, body: cetera_payload, headers: { 'Content-Type': 'application/json' })

      allow(controller).to receive(:get_facet_cutoff).and_return(stubbed_custom_cutoff)

      get :show

      expect(response).to have_http_status(:ok)

      def visible_selector(index)
        [
          'div.browseFacets',
          'div.facetSection.clearfix.Dataset-Information_Superhero',
          'ul',
          "li:nth-child(#{index})",
          'a'
        ].join(' > ')
      end

      custom_facets.first['options'].pluck('text').first(stubbed_custom_cutoff).each_with_index do |text, index|
        assert_select(visible_selector(index + 1))
      end

      def truncated_selector(index)
        [
          'div.browseFacets',
          'div.facetSection.clearfix.Dataset-Information_Superhero',
          'div',
          "a:nth-child(#{index})"
        ].join(' > ')
      end

      custom_facets.first['options'].pluck('text')[stubbed_custom_cutoff..-1].each_with_index do |text, index|
        assert_select(truncated_selector(index + 1))
      end
    end
  end

  #########################################################################
  # Let's test some failure cases. If Core is down, sure, we're hosed.
  # But, if just Cly or Cetera is down or slow, we should at least timeout.
  # It's important not to let FE requests get backed up.

  describe 'browse' do
    let(:search_failure_message) do
      %q(We're sorry. Results could not be retrieved at this time. Please try again later.)
    end

    before do
      allow(CurrentDomain).to receive(:cname).and_return('example.com')
    end

    describe 'via Cetera' do
      # Cetera should be paired with new catalog
      let(:selector) { 'div.browse2-results-pane.clearfix > div.browse2-results > div > span' }

      before do
        stub_feature_flags_with(:cetera_search => true)
      end

      it 'should fail gracefully on timeout' do
        stub_request(:get, catalog_endpoint).to_timeout

        get :show

        expect(response).to have_http_status(:ok)
        assert_select(selector, search_failure_message)
      end

      it 'should fail gracefully on server error' do
        stub_request(:get, catalog_endpoint).to_return(status: 500)

        get(:show)

        expect(response).to have_http_status(:ok)
        assert_select(selector, search_failure_message)
      end

      it 'should fail gracefully on unexpected payload' do
        stub_request(:get, catalog_endpoint).to_return(status: 200, body: 'malformed')

        get(:show)

        expect(response).to have_http_status(:ok)
        assert_select(selector, search_failure_message)
      end
    end

    describe 'via Core/Cly' do
      let(:selector) { 'div.browseList > div.results > div > span' }

      before do
        stub_feature_flags_with(:cetera_search => false)
      end

      it 'should fail gracefully on timeout' do
        stub_request(:get, catalog_endpoint).to_timeout

        get :show

        expect(response).to have_http_status(:ok)
        assert_select(selector, search_failure_message)
      end

      it 'should fail gracefully on server error' do
        stub_request(:get, catalog_endpoint).to_return(status: 500)

        get :show

        expect(response).to have_http_status(:ok)
        assert_select(selector, search_failure_message)
      end

      it 'should fail gracefully on unexpected payload' do
        stub_request(:get, catalog_endpoint).to_return(status: 200, body: 'malformed')

        get :show

        expect(response).to have_http_status(:ok)
        assert_select(selector, search_failure_message)
      end
    end
  end

  # Testing /browse/embed because that path is relatively less tested
  describe 'embedded new catalog results with Cetera' do
    let(:selector) { 'div.browse2-result-timestamp > div.browse2-result-timestamp-label' }
    let(:query_params) do
      {
        domains: 'example.com',
        limit: 10,
        offset: 0,
        search_context: 'example.com'
      }.merge(viz_params)
    end
    let(:stub_response) do
      {
        status: 200,
        body: cetera_payload,
        headers: { 'Content-Type': 'application/json' }
      }
    end

    before do
      expect(Federation).to receive(:federations).and_return([]).exactly(3).times
      allow(CurrentDomain).to receive(:cname).and_return('example.com')
    end

    context 'when hide_dates_on_primer_and_data_catalog is false' do
      before do
        stub_feature_flags_with(
          :cetera_search => true,
          :hide_dates_on_primer_and_data_catalog => false
        )
      end

      it 'should show created at timestamp when sorting by newest' do
        stub_request(:get, catalog_endpoint).
          with(query: query_params.merge(order: 'createdAt')).
          to_return(stub_response)

        get :embed, sortBy: 'newest'

        expect(response).to have_http_status(:ok)
        assert_select(selector, 'Created')
        assert_select(selector, count: 0, text: 'Updated')
      end

      it 'should show updated at timestamp when sorting by default' do
        stub_request(:get, catalog_endpoint).
          with(query: query_params.merge(order: 'relevance')).
          to_return(stub_response)

        get :embed # default sort should be relevance

        expect(response).to have_http_status(:ok)
        assert_select(selector, 'Updated')
        assert_select(selector, count: 0, text: 'Created')
      end

      it 'should show updated at timestamp when sorting by last updated' do
        stub_request(:get, catalog_endpoint).
          with(query: query_params.merge(order: 'updatedAt')).
          to_return(stub_response)

        get :embed, sortBy: 'last_modified'

        expect(response).to have_http_status(:ok)
        assert_select(selector, 'Updated')
        assert_select(selector, count: 0, text: 'Created')
      end

      it 'should should set the X-Frame-Options header to ALLOWALL' do
        stub_request(:get, catalog_endpoint).
          with(query: query_params.merge(order: 'relevance')).
          to_return(stub_response)

        get :show, id: 'four-four', customization_id: 'default'

        expect(response).to have_http_status(:ok)
        expect(response.headers['X-Frame-Options']).to eq('ALLOWALL')
      end
    end

    context 'when hide_dates_on_primer_and_data_catalog is true' do
      before do
        stub_feature_flags_with(
          :cetera_search => true,
          :hide_dates_on_primer_and_data_catalog => true
        )
      end

      it 'should not show created at timestamp when sorting by newest' do
        stub_request(:get, catalog_endpoint).
          with(query: query_params.merge(order: 'createdAt')).
          to_return(stub_response)

        get :embed, sortBy: 'newest'

        expect(response).to have_http_status(:ok)
        assert_select(selector, count: 0, text: 'Created')
        assert_select(selector, count: 0, text: 'Updated')
      end

      it 'should now show updated at timestamp when sorting by default' do
        stub_request(:get, catalog_endpoint).
          with(query: query_params.merge(order: 'relevance')).
          to_return(stub_response)

        get :embed # default sort should be relevance

        expect(response).to have_http_status(:ok)
        assert_select(selector, count: 0, text: 'Updated')
        assert_select(selector, count: 0, text: 'Created')
      end

      it 'should not show updated at timestamp when sorting by last updated' do
        stub_request(:get, catalog_endpoint).
          with(query: query_params.merge(order: 'updatedAt')).
          to_return(stub_response)

        get :embed, sortBy: 'last_modified'

        expect(response).to have_http_status(:ok)
        assert_select(selector, count: 0, text: 'Updated')
        assert_select(selector, count: 0, text: 'Created')
      end

    end
  end

  private

  def clytemnestra_payload
    @clytemnestra_payload ||= fixture('catalog_search_results.json')
  end

  def cetera_payload
    @cetera_payload ||= fixture('cetera_search_results.json')
  end

end
