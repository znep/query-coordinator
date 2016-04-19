require 'forwardable'
require 'httparty'
require 'ostruct'

module Cetera
  def self.search_views(opts, cookies, request_id)
    cetera_url = "#{APP_CONFIG.cetera_host}/catalog/v1"
    query = cetera_soql_params(opts)

    Rails.logger.info("Cetera request to #{cetera_url} with params: #{query.inspect}")

    options = {
      cookies: cookies, # Cetera is fine with empty cookie string
      format: :json,
      headers: { 'X-Socrata-Host' => CurrentDomain.cname,
                 'X-Socrata-RequestId' => request_id }.compact,
      query: query.to_query,
      timeout: 5
    }

    result = HTTParty.get(cetera_url, options)
    result.success? && CeteraSearchResult.new(result)
  end

  # Translate FE 'display_type' to Cetera 'type' (as used in limitTo/only)
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

  # translate FE 'sortBy' values to Cetera 'order'
  def self.translate_sort_by(sort_by)
    {
      nil => 'relevance', # Critical that nil is a key
      'relevance' => 'relevance',
      'most_accessed' => 'page_views_total',
      'alpha' => 'name',
      'newest' => 'createdAt',
      'oldest' => 'createdAt ASC',
      'last_modified' => 'updatedAt'
    }.fetch(sort_by) # For Core/Cly parity, we want no results if sort_by is bogus
  end

  def self.cetera_soql_params(opts = {})
    (opts[:metadata_tag] || {}).merge(
      domains: opts[:domains].join(','), # Cetera does not yet support domains[]
      boostDomains: opts[:domain_boosts], # Federated domains have searchBoost values
      search_context: CurrentDomain.cname,
      only: translate_display_type(opts[:limitTo], opts[:datasetView]),
      categories: opts[:categories],
      tags: opts[:tags],
      q: opts[:q],
      offset: opts[:page] ? (opts[:page] - 1) * opts[:limit] : 0,
      limit: opts[:limit],
      order: translate_sort_by(opts[:sortBy])
    ).compact
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

    def display
      case type

      when 'datalens' then Cetera::Displays::DataLens
      when 'pulse' then Cetera::Displays::Pulse
      when 'draft' then Cetera::Displays::Draft
      when 'story' then Cetera::Displays::Story

      when 'dataset' then Cetera::Displays::Dataset
      when 'chart' then Cetera::Displays::Chart
      when 'map' then Cetera::Displays::Map
      when 'calendar' then Cetera::Displays::Calendar
      when 'filter' then Cetera::Displays::Filter

      # Cetera is replacing type 'href' with type 'link'
      when 'href' then Cetera::Displays::Link
      when 'link' then Cetera::Displays::Link

      when 'file' then Cetera::Displays::File
      when 'form' then Cetera::Displays::Form
      when 'api' then Cetera::Displays::Api

      else
        airbrake_type_error(type)
        # In development, you might want this to raise.
        # In production, probably not.
        #
        # NOTE: we could set name and title to type and roll with it
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
  end

  class SearchResult
    attr_reader :data

    class << self; attr_accessor :klass; end

    def initialize(data = {})
      @data = data
    end

    def self.from_result(result)
      new(JSON.parse(result, max_nesting: 25)) if result.present?
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

  # Who uses this @klass?
  class CeteraSearchResult < SearchResult
    @klass = Cetera::CeteraResultRow
  end
end
