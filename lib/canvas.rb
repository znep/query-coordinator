# autoload is not threadsafe, so require everything we might need
requires = %w{search_result view}
requires.each{ |r| require File.join(Rails.root, 'app/models', r) }

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

      def metadata_tag
        return nil unless Environment.context == :facet_page
        return Environment.page_config.metadata_fieldset + '_' +
               Environment.page_config.metadata_field + ':' +
               Environment.facet_value
      end
    end
  end

  class CanvasWidget
    attr_reader :elem_id

    def initialize(data, id_prefix = '')
      @data = data
      @elem_id = "#{id_prefix}_#{self.class.name.split(/::/).last}"

      local_properties = @data.properties.to_hash rescue {}
      local_properties.deep_symbolize_keys!
      @properties = Hashie::Mash.new self.default_properties.deep_merge(local_properties)
    end

    def stylesheet
      result = self.style_definition.reduce('') do |str, definition|
        # get config value
        property_value = self.find_property(definition[:data])

        # match transformations in js customizer
        property_value = "#{property_value[:value]}#{property_value[:unit]}" if definition[:hasUnit]
        property_value = definition[:map][property_value.to_sym] if definition[:map]

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

    def can_render?
      return true
    end

    def prepare!
      return unless self.has_children?
      threads = self.children.map{ |child| Thread.new{ child.prepare! } if child.can_render? }
      threads.compact.each{ |thread| thread.join }
    end

    def properties
      return @properties
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
          return nil
        end
      end
    end

  protected
    class_inheritable_accessor :default_properties, :style_definition, :content_definition

    def find_property(key)
      current = @properties

      # use all? here, so we just keep going until we hit a dead end, or we finish
      key.split(/\./).all?{ |subkey| current = current[subkey] }

      throw ">>> set a default for #{key} on #{self.class}! <<<" if current.nil?
      return current
    end

    self.default_properties = {}
    self.style_definition = []
    self.content_definition = []
  end

# WIDGETS (LAYOUT)

  class Container < CanvasWidget
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

  class Catalog < CanvasWidget
    include BrowseActions
    attr_reader :processed_browse

    def prepare!
      browse_options = self.properties.browseOptions.to_hash
      browse_options.deep_symbolize_keys!

      if (self.properties.respectFacet == true) && (Environment.context == :facet_page)
        browse_options[:metadata_tag] = Environment.metadata_tag
      end

      @processed_browse = process_browse(Environment.request, browse_options)
    end
  protected
    self.default_properties = {
      browseOptions: {
        ignore_params: [ :page_name, :facet_name, :facet_value ]
      },
      respectFacet: true
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

  class FacetList < CanvasWidget
    attr_reader :facet_values

    def can_render?
      return Environment.context == :facet_listing
    end

    def prepare!
      config = CurrentDomain.configuration('site_theme')
      @facet_values = [] and return if config.properties.custom_dataset_metadata.nil?

      fieldset = config.properties.custom_dataset_metadata.find{ |fieldset|
                   fieldset.name == Environment.page_config.metadata_fieldset }
      @facet_values = [] and return if fieldset.nil?

      field = fieldset.fields.find{ |field| field.name == Environment.page_config.metadata_field }
      @facet_values = [] and return if field.nil? || field.options.nil?

      @facet_values = field.options[0..self.properties.maximum]
    end
  protected
    self.default_properties = {
      style: {
        orientation: 'horizontal'
      },
      maximum: 100
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

  class Html < CanvasWidget
    # nothing to do here. html is just html!
  end

  class ViewList < CanvasWidget
    attr_reader :view_count, :view_results, :current_page

    def prepare!
      @current_page = (Environment.params[:viewList] || {})[:page].to_i || 1

      search_options = self.properties.searchOptions
      search_options[:page] = @current_page || 1

      if (self.properties.respectFacet == true) && (Environment.context == :facet_page)
        search_options[:metadata_tag] = Environment.metadata_tag
      end

      search_response = SearchResult.search('views', search_options)[0]
      @view_count = search_response.count
      @view_results = search_response.results
    end
  protected
    self.default_properties = {
      searchOptions: {
        limit: 10,
        orderBy: 'most_accessed',
        page: 1
      },
      pagination: true,
      respectFacet: true,
      resultCount: true
    }
  end

  class ViewPreview < CanvasWidget
    attr_reader :view

    def prepare!
      if self.properties.viewUid.nil?
        search_options = self.properties.searchOptions.merge({ limit: 1, page: 1 })

        if (self.properties.respectFacet == true) && (Environment.context == :facet_page)
          search_options[:metadata_tag] = Environment.metadata_tag
        end

        search_response = SearchResult.search('views', search_options)[0]
        if search_response.count == 0
          @view = false
        else
          @view = search_response.results.first
        end
      else
        @view = (View.find self.properties.viewUid) || false
      end
    end
  protected
    self.default_properties = {
      details: 'above',
      noResultsMessage: 'No views could be found matching these criteria.',
      respectFacet: true,
      searchOptions: {
        limitTo: ['maps', 'charts'],
        orderBy: 'most_accessed'
      },
      style: {
        height: { value: 30, unit: 'em' }
      },
      showDescription: false,
      showLink: false,
      showTitle: true,
      titleTag: 'h2',
      viewUid: nil
    }
    self.style_definition = [
      { data: 'style.height', selector: '.fullHeight', css: 'height', hasUnit: true }
    ]
  end
end
