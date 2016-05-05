# autoload is not threadsafe, so require everything we might need
requires = %w{view comment}
requires.each{ |r| require File.join(Rails.root, 'app/models', r) }
require 'clytemnestra'

require 'rss/2.0'
require 'timeout'

module Canvas

# GENERAL

  class Environment
    class << self
      attr_accessor :context
      attr_accessor :facet_name
      attr_accessor :facet_value
      attr_accessor :page_config
      attr_accessor :params
      attr_accessor :request
      attr_accessor :bindings
      attr_accessor :locale_config

      def metadata_tag
        return nil unless Environment.context == :facet_page
        return Environment.page_config.metadata_fieldset + '_' +
               Environment.page_config.metadata_field + ':' +
               Environment.facet_value
      end

      def prepare_thread!
        I18n.config = Environment.locale_config
      end
    end
  end

  class CanvasWidget
    attr_accessor :elem_id, :binding

    def initialize(data, id_prefix = '')
      @data = data
      @id_prefix = id_prefix
      @elem_id = "#{id_prefix}_#{self.class.name.split(/::/).last}"

      load_properties(@data.properties)
    end

    def stylesheet
      result = self.style_definition.reduce('') do |str, definition|
        # get config value
        property_value = self.find_property(definition[:data])

        # transform property value according to customizer rules
        property_value = property_value.size if property_value.is_a? Array
        property_value = "#{property_value[:value]}#{property_value[:unit]}" if definition[:hasUnit]
        property_value = definition[:map][property_value.to_sym] if definition[:map]
        property_value = "#{100.0 / property_value}%" if definition[:toProportion]

        # commas
        str + "##{@elem_id} #{definition[:selector]} {#{definition[:css]}: #{property_value}}\n"
      end

      result += self.children.map{ |child| child.stylesheet }.join if self.has_children?
      return result
    end

    def style_definition
      return self.style_definition.to_json
    end

    def content_definition
      return self.content_definition.to_json
    end

    def has_children?
      return @data.children.is_a? Array
    end

    def children
      return nil unless self.has_children?
      return @children ||= CanvasWidget.from_config(@data.children, @elem_id)
    end

    def passthrough?
      return false
    end

    def can_prepare?
      return true
    end

    def can_render?
      return self.can_prepare?
    end

    def prepare!
      return unless self.has_children?
      threads = self.children.map{ |child| Thread.new{ Environment.prepare_thread!; child.prepare! } if child.can_prepare? }
      threads.compact.each{ |thread| thread.join }
    end

    def clone(id_prefix = @id_prefix)
      jango_fett = self.class
      stormtrooper = jango_fett.new @data.clone, id_prefix
      stormtrooper.children = self.children.map{ |child| child.clone(stormtrooper.id_prefix) } if stormtrooper.has_children?
      return stormtrooper
    end

    def binding
      return @binding
    end

    def bind(views)
      @binding = views
      self.children.each{ |child| child.bind(views) } if self.has_children?
    end

    def prepare_bindings!
      return unless self.has_children?
      threads = self.children.map{ |child| Thread.new{ Environment.prepare_thread!; child.prepare_bindings! } }
      threads.each{ |thread| thread.join }
    end

    def get_view
      if self.properties.viewUid
        begin
          return View.find self.properties.viewUid
        rescue CoreServer::ResourceNotFound
          return nil
        rescue CoreServer::CoreServerError
          return nil
        end
      elsif self.binding
        return self.binding.views.first
      end
    end

    def get_views
      if self.properties.viewUids
        begin
          return View.find_multiple self.properties.viewUids
        rescue CoreServer::ResourceNotFound
          return []
        rescue CoreServer::CoreServerError
          return []
        end
      elsif self.binding
        return self.binding.views
      end
    end

    def properties
      return @properties
    end

    def stylesheets
      return nil
    end

    def method_missing(key, *args)
      return @data[key]
    end

    def self.from_config(config, id_prefix = '')
      if config.is_a? Array
        i = 0
        return config.map do |config_item|
          i += 1
          CanvasWidget.from_config(config_item, id_prefix + i.to_s)
        end
      else
        # eg 'two_column_layout' ==> 'TwoColumnLayout'
        klass_name = config.type.gsub(/^(.)|(_.)/){ |str| str[-1].upcase }
        begin
          return Canvas.const_get(klass_name).new(config, id_prefix)
        rescue NameError => ex
          throw "There is no Canvas widget of type '#{config.type}'."
        end
      end
    end

  protected
    attr_accessor :id_prefix
    class_attribute :default_properties, :style_definition, :content_definition

    def find_property(key)
      current = @properties

      # use all? here, so we just keep going until we hit a dead end, or we finish
      key.split(/\./).all?{ |subkey| current = current[subkey] }

      throw ">>> set a default for #{key} on #{self.class}! <<<" if current.nil?
      return current
    end

    def children=(children)
      @children = children
    end

    self.default_properties = {}
    self.style_definition = []
    self.content_definition = []

    def default_url_options
      { host: CurrentDomain.cname }
    end

  private
    def load_properties(data)
      local_properties = (data.to_hash rescue {}).deep_symbolize_keys
      @properties = Hashie::Mash.new self.default_properties.deep_merge(local_properties)
    end
  end

# WIDGETS (CONTROL FLOW)

  class ControlFlowWidget < CanvasWidget
    def passthrough?
      return true
    end
  end

  class Binding < ControlFlowWidget
    def prepare_bindings!
      binding = Environment.bindings[self.properties.dataBinding]

      self.children.each do |child|
        child.bind(binding)
      end

      super
    end
  protected
    self.default_properties = {
      dataBinding: nil
    }
  end

  # takes a view that's bound to it and rebinds children
  # with related views
  class RelatedViews < ControlFlowWidget
    def prepare_bindings!
      view = self.get_view
      return if view.nil?

      views = view.find_related(1, self.properties.limit, self.properties.sortBy)
      self.children.each{ |child| child.bind(Hashie::Mash.new({ views: views })) }
    end
  protected
    self.default_properties = {
      limit: 10,
      sortBy: 'most_accessed'
    }
  end

  class Repeater < ControlFlowWidget
    def prepare_bindings!
      binding = Environment.bindings[self.properties.dataBinding]

      i = 0
      existing_children = self.children.dup
      self.children = binding.views.take(self.properties.limit).map do |view|
        existing_children.map do |existing_child|
          child = existing_child.clone("#{existing_child.id_prefix}_#{i += 1}")
          child.bind(Hashie::Mash.new({ views: [ view ] }))
          child
        end
      end.flatten

      super
    end
  protected
    self.default_properties = {
      dataBinding: nil,
      limit: 5
    }
  end

# WIDGETS (LAYOUT)

  class Container < CanvasWidget
  protected
    self.default_properties = {
      classNames: ['contentBox']
    }
  end

  class Popup < CanvasWidget
  protected
    self.default_properties = {
      buttonClassNames: [],
      buttonText: '',
      contentClassNames: [],
      contentTitle: ''
    }
  end

  class TickerLayout < CanvasWidget
  protected
    self.default_properties = {
      childTitles: [],
      pager: {
        divider: '/',
        type: 'incremental'
      },
      rotationInterval: 9,
      rotationType: 'slide'
    }
  end

  class TwoColumnLayout < CanvasWidget
  protected
    self.default_properties = {
      style: {
        contentPadding: { value: 1, unit: 'em' },
        leftColumnWidth: { value: 50, unit: '%' },
        rightColumnWidth: { value: 50, unit: '%' }
      }
    }
    self.style_definition = [
      { data: 'style.contentPadding', selector: '.wrapper', css: 'padding', hasUnit: true },
      { data: 'style.leftColumnWidth', selector: '.leftColumn', css: 'width', hasUnit: true },
      { data: 'style.rightColumnWidth', selector: '.rightColumn', css: 'width', hasUnit: true }
    ]
  end

# WIDGETS (CONTENT)

  # PROBABLY SHOULD HAVEDONE ALL THE VIEWM ETADATA THIS WAY OH WEL TOO LATE
  class BoundLink < CanvasWidget
    include Rails.application.routes.url_helpers

    attr_reader :href, :text

    def can_render?
      return !@href.blank?
    end

    def prepare!
      view = self.get_view
      return if view.nil?

      @href = view_path(view.route_params)
      @href += '?' + self.properties.queryParams.to_param unless self.properties.queryParams.empty?
      @href += '#' + self.properties.hashParams.to_param unless self.properties.hashParams.empty?

      @text = self.properties.text || view.name
    end
  protected
    self.default_properties = {
      classNames: [ 'boundLink' ],
      text: nil, # leave nil for view name
      hashParams: {},
      queryParams: {}
    }
  end

  class Breadcrumb < CanvasWidget
  protected
    self.default_properties = {
      breadcrumbRoot: [
        { text: 'Home', href: '/' }
      ]
    }
  end

  class Catalog < CanvasWidget
    include BrowseActions
    attr_reader :processed_browse

    def prepare!
      browse_options = self.properties.browseOptions.to_hash.deep_symbolize_keys

      if (self.properties.respectFacet == true) && (Environment.context == :facet_page)
        if self.properties.facetStyle == 'metadata'
          browse_options[:metadata_tag] = Environment.metadata_tag
        elsif self.properties.facetStyle == 'search'
          browse_options[:q] = Environment.facet_value
        end
      end

      @processed_browse = process_browse(Environment.request, browse_options)
    end
  protected
    self.default_properties = {
      browseOptions: {
        ignore_params: [ :page_name, :facet_name, :facet_value ]
      },
      facetStyle: 'metadata',
      respectFacet: true
    }
  end

  class DataSplash < CanvasWidget
    attr_reader :fragment

    def can_render?
      return @fragment.nil? || (@fragment != '')
    end

    def prepare!
      @fragment = CurrentDomain.templates['data_splash']
    end
  end

  class ExternalFeed < CanvasWidget
    attr_reader :error_message, :feed_items

    def prepare!
      begin
        Timeout::timeout(2) do
          @feed_items = RSS::Parser.parse(self.properties.feedUrl).items[0...self.properties.maxItems]
        end
      rescue Timeout::Error
        @error_message = 'The requested feed did not respond in time.'
      rescue OpenURI::HTTPError, RSS::NotWellFormedError => ex
        @error_message = ex.message
      end
    end

  protected
    self.default_properties = {
      feedUrl: nil,
      maxItems: 5,
      show: [ { type: 'title', link: true }, { type: 'description' } ],
      updateEvery: 60 # in minutes # NOTIMPLEMENTED
    }
  end

  class FacebookShare < CanvasWidget
    include Rails.application.routes.url_helpers

    attr_reader :fb_opts

    def prepare!
      temp = {}

      # if we're databound, take those as default
      view = self.get_view
      if !view.nil?
        temp['href'] = view_url(view)
      end

      # always respect these if they're provided
      temp.merge!(self.properties.to_hash
                   .only('action', 'href', 'layout', 'send', 'show-faces', 'width')
                   .delete_if{ |k, v| v.nil? })

      # if we've gotten here without an href, plug in the current page
      temp['href'] = Environment.request.protocol + Environment.request.host_with_port + Environment.request.path if temp['href'].blank?

      # copy over to final hash with appropriate key
      @fb_opts = {}
      temp.each{ |k, v| @fb_opts["data-#{k}"] = v }
    end
  protected
    # refer to http://developers.facebook.com/docs/reference/plugins/like/ to learn about these keys
    self.default_properties = {
      action: 'recommend',
      href: nil, # nil for current page, string for custom
      layout: 'button_count',
      send: false,
      :'show-faces' => true,
      width: 100
    }
  end

  class FacetList < CanvasWidget
    attr_reader :facet_values, :by_alpha

    def prepare!
      config = CurrentDomain.configuration('metadata')
      @facet_values = [] and return if config.properties.fieldsets.nil?

      target_fieldset = self.properties.metadata_fieldset || Environment.page_config.metadata_fieldset

      fieldset = config.properties.fieldsets.find{ |fieldset| fieldset.name == target_fieldset }
      @facet_values = [] and return if fieldset.nil?

      target_field = self.properties.metadata_field || Environment.page_config.metadata_field

      field = fieldset.fields.find{ |field| field.name == target_field }
      @facet_values = [] and return if field.nil? || field.options.nil?

      @facet_values = field.options[0..self.properties.maximum]

      if self.properties.alpha_index
        @by_alpha = @facet_values.reduce({}) do |by_alpha, val|
          (by_alpha[val[0,1].downcase] ||= []) << val
          by_alpha
        end
      end
    end
  protected
    self.default_properties = {
      alpha_index: false,
      style: {
        orientation: 'horizontal'
      },
      maximum: 100,
      metadata_fieldset: nil,
      metadata_field: nil,
      target_facet: nil
    }
    self.style_definition = [
      { data: 'style.orientation', selector: 'li', css: 'display', map: { horizontal: 'inline-block', vertical: 'block' } }
    ]
  end

  class FacetValue < CanvasWidget
    def can_render?
      return Environment.context == :facet_page
    end
  protected
    self.default_properties = {
      tag: 'h1'
    }
  end

  class FeaturedViews < CanvasWidget
    include Rails.application.routes.url_helpers

    attr_reader :featured_views

    def can_render?
      return !@featured_views.empty?
    end

    def prepare!
      if self.properties.fromDomainConfig
        @featured_views = CurrentDomain.featured_views if CurrentDomain.featured_views.present?
      else
        @featured_views = self.properties.featured_views
      end

      if @featured_views.blank? || !(@featured_views.is_a? Array)
        @featured_views = []
        return
      end

      # get the freshest versions of the canonical view urls
      real_views = View.find_multiple(@featured_views.map{ |fv| fv.viewId })

      @featured_views.each do |fv|
        real_view = real_views.find{ |real_view| fv.viewId == real_view.id }
        ((@featured_views.delete fv) and next) if real_view.nil? || !real_view.is_public?

        fv.href = view_path(real_view.route_params)

        # HACK: URL override for featured views
        if self.properties && self.properties.urlOverride
          begin
            if !real_view.merged_metadata['custom_fields'][self.properties.urlOverride.first][self.properties.urlOverride.last].blank?
              fv.href = real_view.merged_metadata['custom_fields'][self.properties.urlOverride.first][self.properties.urlOverride.last]
            end
          rescue
            # Chomp Chomp
          end
        end
      end
    end
  protected
    self.default_properties = {
      featured_views: []
    }
  end

  class Feed < CanvasWidget
    attr_reader :js_opts, :main_view

    def prepare!
      @main_view = self.get_view

      @js_opts = self.properties.controlOptions
    end
  protected
    self.default_properties = {
      allowComments: false,
      controlOptions: {
        filterCategories: nil
        # see feed-list.js default options
      }
    }
  end

  class Html < CanvasWidget
    def prepare!
      # people can specify custom texts per facet page; otherwise falls back to content key
      if (Environment.context == :facet_page) && !self.properties.contentForFacet.empty?
        content = self.properties.contentForFacet[Environment.facet_value]
        self.properties.content = content unless content.blank?
      end
    end

  protected
    self.default_properties = {
      content: '',
      contentForFacet: {}
    }
  end

  class Pager < CanvasWidget
    attr_reader :binding, :current_page

    def can_render?
      return self.binding && !self.binding.empty?
    end

    def prepare!
      @current_page = Environment.request.params[self.binding.properties.paramGroup]['page'].to_i rescue 1
    end
  protected
    self.default_properties = {
      label: ''
    }
  end

  class InlineLogin < CanvasWidget
  end

  class Stories < CanvasWidget
    attr_reader :stories

    def can_render?
      return !@stories.empty?
    end

    def prepare!
      load_properties(CurrentDomain.theme.stories) if self.properties.fromDomainConfig

      @stories = Story.find.sort
    end
  protected
    self.default_properties = {
      pager: {
        position: 'center',
        type: 'bullets',
        disposition: 'light'
      },
      orientation: 'left',
      height: { value: 25, unit: 'em' },
      box: {
        headline: {
          color: 'f7f7f7',
          font_family: 'Georgia',
          shadow: {
            alpha: 0.6,
            radius: { value: 3, unit: 'px' }
          },
          font_size: { value: 1.8, unit: 'em' }
        },
        body: {
          color: 'dddddd',
          font_family: 'Helvetica Neue',
          shadow: {
            alpha: 0.3,
            radius: { value: 2, unit: 'px' }
          },
          font_size: { value: 1.4, unit: 'em' }
        },
        color: '000000',
        shadow: 0,
        width: { value: 35, unit: 'em' },
        alpha: 0.8,
        margin: { value: 1, unit: 'em' }
      },
      autoAdvance: 7
    }
  end

  class TwitterShare < CanvasWidget
    attr_reader :twitter_opts

    def prepare!
      temp = {}

      # if we're databound, take those as default
      view = self.get_view
      if !view.nil?
        temp['text'] = view.name
        temp['url'] = Environment.request.protocol + Environment.request.host_with_port + "/d/#{view.id}"
      end

      # always respect these if they're provided
      temp.merge!(self.properties.to_hash
                   .only('text', 'url', 'size')
                   .delete_if{ |k, v| v.nil? || ((k == 'size') && (v != 'large')) })

      # copy over to final hash with appropriate key
      @twitter_opts = {}
      temp.each{ |k, v| @twitter_opts["data-#{k}"] = v }
    end
  protected
    self.default_properties = {
      lang: 'en',
      text: nil, # nil for current page, string for custom
      url: nil, # nil for current page, string for custom
      size: nil # nil for normal, 'large' for large
    }
  end

  class ViewAggregate < CanvasWidget
    attr_reader :value

    def can_render?
      return !@value.nil?
    end

    def prepare!
      view = self.get_view
      return value = nil if view.nil?

      column = view.column_by_id_or_field_name(self.properties.column)
      return value = nil if column.nil?

      request_body = {
        'name' => view.name,
        'columns' => [{
          'id' => column.id,
          'name' => column.name,
          'format' => {
            'aggregate' => self.properties.aggregate
          }
        }],
        'originalViewId' => view.id
      }

      # TODO: query

      url = "/views/INLINE/rows.json?method=getAggregates"
      aggregates = JSON.parse(CoreServer::Base.connection.create_request(url, request_body.to_json,
                                                                         { 'X-Socrata-Federation' => 'Honey Badger' }))
      @value = aggregates.first['value']
    end

  protected
    self.default_properties = {
      aggregate: 'count',
      classNames: [],
      column: nil,
      descriptor: 'widget',
      query: nil,
      tag: 'div',
      viewUid: nil
    }
  end

  class ViewEmbed < CanvasWidget
    attr_reader :view

    def can_render?
      return !@view.nil?
    end

    def prepare!
      @view = self.get_view
    end
  end

  class ViewFilter < CanvasWidget
  protected
    self.default_properties = {
      filterCondition: {
        type: 'operator',
        value: 'AND',
        metadata: { unifiedVersion: 2 },
        children: []
      },
      viewFilterGroup: nil
    }
  end

  class ViewList < CanvasWidget
    attr_reader :view_count, :view_results, :current_page

    def prepare!
      @current_page = (Environment.params[:viewList] || {})[:page].to_i || 1
      @view_results = self.get_views

      if @view_results.nil?
        search_options = self.properties.searchOptions
        search_options[:page] = @current_page || 1

        if (self.properties.respectFacet == true) && (Environment.context == :facet_page)
          if self.properties.facetStyle == 'metadata'
            search_options[:metadata_tag] = Environment.metadata_tag
          elsif self.properties.facetStyle == 'search'
            search_options[:q] = Environment.facet_value
          end
        end

        search_response = Clytemnestra.search_views(search_options)
        @view_count = search_response.count
        @view_results = search_response.results
      else
        @view_count = -1 # FIXME
      end
    end
  protected
    self.default_properties = {
      facetStyle: 'metadata',
      searchOptions: {
        limit: 10,
        orderBy: 'most_accessed',
        page: 1
      },
      metadata: [ # TODO(never): if canvas were to live i'd merge this with ViewPreview's..
        { type: 'name' }, { type: 'type' }
      ],
      pagination: true,
      respectFacet: true,
      resultCount: true
    }
  end

  class ViewPreview < CanvasWidget
    attr_reader :view

    def prepare!
      @view = self.get_view

      if @view.nil?
        search_options = self.properties.searchOptions.merge({ limit: 1, page: 1 })

        if (self.properties.respectFacet == true) && (Environment.context == :facet_page)
          if self.properties.facetStyle == 'metadata'
            search_options[:metadata_tag] = Environment.metadata_tag
          elsif self.properties.facetStyle == 'search'
            search_options[:q] = Environment.facet_value
          end
        end

        begin
          search_response = Clytemnestra.search_views(search_options)

          if search_response.count == 0
            @view = false
          else
            @view = search_response.results.first
          end
        rescue CoreServer::ResourceNotFound
          # some configurations of catalog search can actually return a 404
          @view = false
        end
      end
    end

    def stylesheets
      ['canvas-view-preview']
    end
  protected
    self.default_properties = {
      classNames: [ 'viewPreview', 'clearfix' ],
      facetStyle: 'metadata',
      metadata: {
        above: [ ],
        below: [ { type: 'title' }, { type: 'description' } ]
      },
      noResultsMessage: 'No views could be found matching these criteria.',
      respectFacet: true,
      searchOptions: {
        limitTo: ['maps', 'charts'],
        orderBy: 'most_accessed'
      },
      style: {
        height: { value: 30, unit: 'em' }
      },
      viewFilterGroup: nil,
      viewUid: nil
    }
    self.style_definition = [
      { data: 'style.height', selector: '.renderTypeNode .fullHeight', css: 'height', hasUnit: true }
    ]
  end

  # UTIL

  # class we can use to fake out the binding step to not try and do anything
  module Util
    class FakeView
      def find_related(page, limit = 10, sortBy = 'most_accessed')
        return []
      end
    end
  end
end
