require 'forwardable'
require 'httparty'
require 'ostruct'

# Interface for Cetera, the new search service https://github.com/socrata/cetera
module Cetera
  def self.base_uri
    APP_CONFIG.cetera_host # cetera_host is misnamed; it is actually a uri.
  end

  def self.get(path, options)
    uri = File.join(base_uri, path)
    Rails.logger.info("Cetera request to #{path} with query: #{options[:query].inspect}")

    response = HTTParty.get(uri, options)
    Rails.logger.error("FAILED Cetera request: #{response.body}") unless response.success?

    response
  end

  def self.get_tags(cookie_string, request_id)
    path = '/catalog/v1/domain_tags'
    opts = { domains: [CurrentDomain.cname] }
    query = cetera_soql_params(opts)
    options = request_options(query, cookie_string, request_id)

    response = get(path, options)
    response.success? ? TagCountResult.new(response) : TagCountResult.new('results' => [])
  end

  # Admins only! For now, do not call this without a search query.
  def self.search_users(search_query, cookie_string, request_id = nil)
    path = '/whitepages/v1'
    options = request_options({ q: search_query }.compact, cookie_string, request_id)

    response = get(path, options)

    # app/controllers/administration_controller.rb does not handle user search failures
    response.success? ? UserSearchResult.new(response) : UserSearchResult.new('results' => [])
  end

  def self.search_owned_by_user(search_query, cookie_string, request_id = nil)
    cleaned_query = cetera_soql_params(search_query)
    # Cetera requires only shared_to param be passed, not for_user
    query = cleaned_query.except(:shared_to)

    response = get(personal_catalog_path, request_options(query, cookie_string, request_id))
    response.success? ? CatalogSearchResult.new(response) : CatalogSearchResult.new('results' => [])
  end

  def self.search_shared_to_user(search_query, cookie_string, request_id = nil)
    cleaned_query = cetera_soql_params(search_query)
    # Cetera requires only shared_to param be passed, not for_user
    cleaned_query[:shared_to] = cleaned_query[:for_user]
    query = cleaned_query.except(:for_user)

    response = get(personal_catalog_path, request_options(query, cookie_string, request_id))
    response.success? ? CatalogSearchResult.new(response) : CatalogSearchResult.new('results' => [])
  end

  # 90%+ of search queries go through here so try not to break anything
  # TODO: Do we want this to match the signature of search_users?
  def self.search_views(opts = {}, cookie_string = nil, request_id = nil)
    path = '/catalog/v1'
    query = cetera_soql_params(opts)
    options = request_options(query, cookie_string, request_id)

    response = get(path, options)
    response.success? && CatalogSearchResult.new(response)
  end

  def self.get_derived_from_views(uid, options = {})
    cookie_string = options.delete(:cookie_string)
    request_id = options.delete(:request_id)
    locale_string = options.delete(:locale)
    search_options = options.merge({
      search_context: CurrentDomain.cname,
      domains: [CurrentDomain.cname],
      derived_from: uid,
      locale: locale_string
    }).compact

    response = search_views(search_options, cookie_string, request_id)

    response ? response.results : []
  end

  #########
  # Helpers

  def self.request_options(query, cookie_string, request_id)
    {
      format: :json,
      headers: {
        'Content-Type' => 'application/json',
        'Cookie' => cookie_string,
        'X-Socrata-Host' => CurrentDomain.cname,
        'X-Socrata-RequestId' => request_id.present? ? request_id : nil
      }.compact,
      query: query.to_query,
      timeout: 5 # seconds, >10x Cetera's median round trip time
    }.compact
  end

  def self.personal_catalog_path
    'personal_catalog/v1'
  end

  #############
  # Translators
  #
  # Prepare Cetera params from browse_options[:search_options] in lib/browse_actions.rb

  def self.cetera_soql_params(opts = {})
    translations = translated_query_params(opts) # Some params must be translated / modified
    metadata = opts[:metadata_tag] || {} # Cetera treats unrecognized keys as custom metadata keys
    combined = [opts, translations, metadata].inject(:merge)

    validated_query_params(combined, metadata.keys) # filter out invalid keys and blank values
  end

  def self.translated_query_params(opts = {})
    {
      boostDomains: opts[:domain_boosts],
      domains: translate_domains(opts[:domains]),
      offset: translate_offset(opts[:offset], opts[:page], opts[:limit]),
      only: translate_display_type(opts[:limitTo], opts[:datasetView]),
      order: translate_sort_by(opts[:sortBy])
    }.compact
  end

  def self.translate_domains(domains)
    domains.present? && domains.join(',') # Cetera does not yet support domains[]
  end

  # Translate FE 'display_type' to Cetera 'type' (as used in limitTo/only)
  # NOTE: the camelCase mirrors the FE params
  def self.translate_display_type(limitTo, datasetView)
    if limitTo == 'tables' && datasetView == 'view'
      'filters'
    else
      {
        'data_lens' => 'datalenses',
        'new_view' => 'datalenses',
        'story' => 'stories',
        'pulse' => 'pulses',
        'tables' => 'datasets',
        'draft' => 'drafts',
        'blob' => 'files',
        'href' => 'links'
      }.fetch(limitTo, limitTo)
    end
  end

  # Translate either the offset from either the provided offset of using the provided page
  def self.translate_offset(offset, page, limit)
    if offset
      offset
    elsif page && limit
      (page - 1) * limit
    else
      0
    end
  end

  # Translate FE 'sortBy' values to Cetera 'order'
  def self.translate_sort_by(sort_by)
    {
      nil => 'relevance', # Critical that nil is a key
      'relevance' => 'relevance',
      'most_accessed' => 'page_views_total',
      'alpha' => 'name',
      'newest' => 'createdAt',
      'oldest' => 'createdAt ASC',
      'last_modified' => 'updatedAt',
      'date' => 'createdAt',
      'name' => 'name'
    }.fetch(sort_by) # For Core/Cly parity, we want no results if sort_by is bogus
  end

  ############
  # Validation

  # Really just validates the keys but that's better than nothing
  def self.validated_query_params(opts = {}, extra_keys = {})
    opts.select do |key, value|
      (valid_cetera_keys.include?(key) || extra_keys.include?(key)) && value.present?
    end
  end

  # Anything not explicitly supported here will be dropped
  def self.valid_cetera_keys
    Set.new(%i(boostCalendars boostCharts boostDatalenses boostDatasets boostDomains boostFiles
               boostFilters boostForms boostHrefs boostMaps boostPulses boostStories categories
               derived_from domains for_user limit locale offset only order q search_context tags
               shared_to))
  end

  # A row of Cetera results
  class CeteraResultRow
    extend Forwardable

    def initialize(data)
      @data = data
      @resource = @data['resource']
      @classification = @data['classification']
      @metadata = @data['metadata']
      @id = @resource['id']

      # NOTE: dataset.js reasons about federation like so: if a row has a domainCName, that row is federated
      # Yes, we have the same thing in two places and one can be defined while the other is not.
      @domainCName = @metadata['domain'] if @metadata['domain'] != CurrentDomain.cname

      @data_ostruct = OpenStruct.new(
        id: @resource['id'],
        link: @data['link'],
        name: @resource['name'],
        description: @resource['description'],
        type: @resource['type'],
        categories: [@classification['domain_category']],
        tags: @classification['domain_tags'],
        viewCount: @resource['view_count'] && @resource['view_count']['page_views_total'].to_i,
        domainCName: @metadata['domain'],
        updatedAt: @resource['updatedAt'],
        createdAt: @resource['createdAt']
      )
    end

    def_delegators :@data_ostruct,
                   :id, :link, :name, :description, :type, :categories, :tags, :viewCount,
                   :domainCName, :updatedAt, :createdAt

    def airbrake_type_error(type)
      Airbrake.notify(
        error_class: 'CeteraUnrecognizedTypeError',
        error_message: "Frontend unable to match Cetera type #{type}"
      )
    end

    def display_map
      {
        'datalens' => Cetera::Displays::DataLens,
        'pulse' => Cetera::Displays::Pulse,
        'draft' => Cetera::Displays::Draft,
        'story' => Cetera::Displays::Story,

        'dataset' => Cetera::Displays::Dataset,
        'chart' => Cetera::Displays::Chart,
        'map' => Cetera::Displays::Map,
        'calendar' => Cetera::Displays::Calendar,
        'filter' => Cetera::Displays::Filter,

        # Cetera is replacing type 'href' with type 'link',
        'href' => Cetera::Displays::Link,
        'link' => Cetera::Displays::Link,

        'file' => Cetera::Displays::File,
        'form' => Cetera::Displays::Form,
        'api' => Cetera::Displays::Api
      }
    end

    def display
      display_map.fetch(type) do |bad_type|
        raise "Bad result type for Cetera: #{bad_type}" if Rails.env.development?
        airbrake_type_error(bad_type)
        Cetera::Displays::Base
      end
    end

    def display_title
      display.title
    end

    def display_class
      display.type.capitalize
    end

    def icon_class
      display.icon_class
    end

    def default_page
      @resource['defaultPage']
    end

    def federated?
      domainCName != CurrentDomain.cname
    end

    # WARN: This is going to change!!!
    # Cetera only returns public objects as of 2015/10/19
    def is_public?
      true
    end

    def story?
      type == 'story'
    end

    def domain_icon_href
      "/api/domains/#{domainCName}/icons/smallIcon"
    end

    # TODO: Remove looking up the view in Core once previewImageId is returned by Cetera.
    # Note that this duplicates view.get_preview_image_url.
    def get_preview_image_url(cookie_string, request_id)
      if story?
        Storyteller.get_tile_image(id, cookie_string, request_id)
      else
        begin
          view = View.find(id)
          if view && view.previewImageId
            "/api/views/#{id}/files/#{view.previewImageId}"
          end
        rescue CoreServer::ResourceNotFound
          nil
        rescue CoreServer::CoreServerError
          nil
        end
      end
    end
  end

  # Parent class for all search result types from Cetera
  class SearchResult
    attr_reader :data

    class << self; attr_accessor :klass; end

    def initialize(data = {})
      @data = data
    end

    def results
      @results ||= (data['results'] || []).map { |data| self.class.klass.new(data) }
    end

    def count
      data['resultSetSize']
    end

    def display
    end
  end

  # Search results from /admin/users (admin only!)
  class UserSearchResult < SearchResult
    @klass = User

    def initialize(data = {})
      super
      data['results'].each do |result|
        result['displayName'] = result['screen_name'] if result['screen_name']
        result['roleName'] = result['role_name'] if result['role_name']
      end
    end
  end

  # Search results from the catalog
  class CatalogSearchResult < SearchResult
    @klass = Cetera::CeteraResultRow
  end

  class TagCountResult < SearchResult
    @klass = Tag

    def initialize(data = {})
      super
      # Format results the same way Cly does so the rest of topics_facet doesn't need to change
      data['results'].each do |result|
        result['name'] = result['domain_tag'] if result['domain_tag']
        result['frequency'] = result['count'] if result['count']
      end
    end
  end
end
