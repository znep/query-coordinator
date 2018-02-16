require 'refinements/attemptable'

class CatalogLandingPage
  using FrontendRefinements::Attemptable

  CONFIGURATION_TYPE = 'catalog_landing_page'
  CONFIGURATION_NAME = 'Catalog Landing Page'
  FEATURED_CONTENT_TYPE = 'catalog_query'
  REQUIRED_METADATA_KEYS = %w(headline description)

  attr_reader :cname, :id
  delegate *[:request_store, :catalog_query, :valid_params, :custom_path], to: self

  def self.request_store
    RequestStore[:catalog_landing_page] ||= {}
  end

  PARAMS_WHITELIST = %w(category limitTo provenance federation_filter)
  PARAMS_BLACKLIST = %w(q)
  def self.valid_params
    request_store[:valid_params] ||= PARAMS_WHITELIST + CurrentDomain.custom_facets
  end

  # True if there is a blacklisted param in the request that has a present value.
  # This is because clearing the searchbar can result in `?q=` leftover.
  def self.blacklisted_param_present?(request)
    request.params.slice(*PARAMS_BLACKLIST).values.map(&method(:sanitize_utf8)).presence.to_a.any?(&:present?)
  end

  def self.sanitize_utf8(value)
    value.encode!('UTF-8', 'UTF-8', invalid: :replace, undef: :replace, replace: '')
  end

  def self.may_activate?(request)
    max_params_to_accept = 1 # Original design wanted this configurable; maybe someday?

    return false if blacklisted_param_present?(request)

    params = request.params.slice(*valid_params)
    return true if (1..max_params_to_accept).include?(params.size)
    return true if special_case_browse?(request)

    false
  end

  def self.special_case_browse?(request)
    request.params.slice(*valid_params).empty? && request.path == '/browse'
  end

  def self.exists?(request)
    pages = CurrentDomain.configuration(:catalog_landing_page).tap do |config|
      return false unless config.present?
    end.properties.keys

    params = request.params.slice(*valid_params)
    return true if params.empty? && pages.include?(custom_path(request))

    pages.include?(catalog_query(params))
  end

  def self.should_route?(request)
    # EN-15742: If a search query has been made, do not show the CLP.
    return false if blacklisted_param_present?(request)

    # EN-15655: Prevent CLP from loading in the select dataset modal (path == '/browse/select_dataset').
    return true if request.path == '/browse'

    pages = CurrentDomain.configuration(:catalog_landing_page).tap do |config|
      return false unless config.present?
    end.properties.keys

    pages.include?(custom_path(request))
  end

  # We have to do CGI escaping here because for some reason the FeaturedContent class decided
  # not to perform any escaping, so we have to do it for it in order to maintain consistency.
  def self.catalog_query(params)
    CGI.escape!(params.map do |key, value|
      case value
        when Array then value.map { |v| "#{key}[]=#{v}" }
        else "#{key}=#{value}"
      end
    end.flatten.sort.join('&'))
  end

  # We have to do CGI escaping here because for some reason the FeaturedContent class decided
  # not to perform any escaping, so we have to do it for it in order to maintain consistency.
  def self.custom_path(request_or_params)
    CGI.escape!(request_or_params.attempt(:params)[:custom_path].tap do |path|
      path.prepend('/') unless path.nil? || path.starts_with?('/')
    end.to_s)
  end

  # 'domain_or_cname' is either a Domain instance or the cname string.
  # 'params' is the request params for a valid CLP to be rendered into an id
  #   (e.g. 'category=Government', '/salt-lake-city', etc.)
  def initialize(domain_or_cname, params)
    @cname = domain_or_cname.attempt(:cname)
    @id = catalog_query(@query = params.slice(*valid_params)).presence ||
      custom_path(params).tap { |x| @vanity_url = true if x.present? }
  end

  def vanity_url?
    @vanity_url
  end

  def params_for_catalog
    return {} unless @vanity_url
    CurrentDomain.configuration(:catalog_landing_page).properties[@id]&.catalog_params || {}
  end

  def to_query
    @query.presence || { custom_path: CGI.unescape(@id) }
  end

  def to_path
    unescaped_id = CGI.unescape(id)
    return unescaped_id if unescaped_id.starts_with?('/')
    "/browse?#{unescaped_id}"
  end

  def to_uri
    path, query = to_path.split('?', 2)
    URI::HTTPS.build(
      host: CurrentDomain.cname,
      path: path,
      query: query
    )
  end

  # See spec/fixtures/vcr_cassettes/clp/configuration.json
  # 'property' optional key to retrieve value for. If nil, then entire property hash is returned
  def metadata(property = nil)
    if configuration.has_property?(id)
      @metadata = configuration.properties[id]
      property.present? ? @metadata[property] : @metadata
    end.to_h
  end

  def update_metadata(new_metadata)
    missing_keys = REQUIRED_METADATA_KEYS - new_metadata.keys
    if missing_keys.present?
      raise ArgumentError.new("The metadata is missing the following key(s): #{missing_keys.inspect}")
    end
    JSON.parse(configuration.create_or_update_property(id, metadata.merge(new_metadata)))
  end

  def update_featured_content(featured_content_item)
    if featured_content_item[:removed]
      resource_id = featured_content_item[:resource_id]
      delete_featured_content(resource_id) if resource_id.present?
    else
      create_or_update_featured_content(featured_content_item)
    end
  end

  # See spec/fixtures/vcr_cassettes/clp/featured_content.json
  def featured_content
    result = {}

    FeaturedContent.fetch(id, FEATURED_CONTENT_TYPE).each do |item|
      if item[:contentType] == 'external'
        item.merge!(
          :previewImageUrl => item.values_at(:previewImage, :previewImageId).compact.first,
          :displayType => 'href'
        )
      elsif item[:contentType] == 'internal'
        begin
          view = View.find(item[:uid])
          item.merge!(view.data.slice(*%w(viewCount)))
          item[:updatedAt] = view.time_last_updated_at
          # EN-15660: use view.display.type instead of view.displayType :(
          item[:displayType] = view.display.type
          item[:isPrivate] = !view.is_public? # See View class regarding semantics of is_private?
        rescue
          # View was deleted
          item[:deleted] = true
        end
      else
        raise "Unknown featured content type: #{item[:contentType]}"
      end

      result["item#{item[:position]}".to_sym] = item unless item[:deleted]
    end

    result
  end

  def create_or_update_featured_content(featured_item)
    FeaturedContent.create_or_update(id, FEATURED_CONTENT_TYPE, featured_item)
  end

  def delete_featured_content(resource_id)
    FeaturedContent.destroy(resource_id)
  end

  private

  def configuration
    Configuration.find_or_create_by_type(CONFIGURATION_TYPE, :name => CONFIGURATION_NAME)
  end

end
