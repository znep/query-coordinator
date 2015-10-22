require 'forwardable'
require 'httparty'
require 'ostruct'

module Cetera
  def self.search_views(opts)
    cetera_url = "#{APP_CONFIG.cetera_host}/catalog/v1"
    query = cetera_soql_params(opts)

    Rails.logger.info("Cetera request with params: #{query.inspect}")

    result = HTTParty.get(cetera_url, query: query)
    CeteraSearchResult.from_result(result.body)
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
        'blob' => 'files',
        'href' => 'links'
      }.fetch(limitTo, limitTo)
    end
  end

  def self.cetera_soql_params(opts = {})
    (opts[:metadata_tag] || {}).merge(
      domains: opts[:domains],
      search_context: CurrentDomain.cname,
      only: translate_display_type(opts[:limitTo], opts[:datasetView]),
      categories: opts[:category],
      tags: opts[:tags],
      q: opts[:q],
      offset: opts[:page] ? (opts[:page] - 1) * opts[:limit] : 0,
      limit: opts[:limit]
    ).reject { |_, v| v.blank? }
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
        updatedAt: @resource['updatedAt']
      )
    end

    def_delegators :@data_ostruct, :id, :link, :name, :description, :type, :categories, :tags, :viewCount, :domainCName, :updatedAt

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

    def new_view?
      type == 'page'
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
