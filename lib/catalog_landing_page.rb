class CatalogLandingPage

  CONFIGURATION_TYPE = 'catalog_landing_page'
  CONFIGURATION_NAME = 'Catalog Landing Page'
  FEATURED_CONTENT_TYPE = 'catalog_query'
  REQUIRED_METADATA_KEYS = %w(headline description)

  attr_reader :cname, :id

  # 'domain_or_cname' is either a Domain instance or the cname string.
  # 'id_or_parms' is the identifier of the specific CLP (e.g. 'category=Government', 'salt-lake-city', etc.)
  #   or it is the params hash from which the id will be derived
  def initialize(domain_or_cname, id_or_params)
    @cname = if domain_or_cname.respond_to?(:cname)
      domain_or_cname.cname
    else
      domain_or_cname
  end

    @id = if id_or_params.is_a?(Hash)
      Constraints::CatalogLandingPageConstraint.catalog_query(id_or_params)
    else
      id_or_params
    end

    raise ArgumentError.new('CatalogLandingPage id cannot be empty') unless @id.present?
  end

  def to_path
    id.starts_with?('/') ? id : "/browse?#{CGI.unescape(id)}"
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
    begin
      if configuration.has_property?(id)
        @metadata = configuration.properties[id]
        property.present? ? @metadata[property] : @metadata
      end
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

  def category_stats(category, request_id)
    Cetera::Utils.get_lens_counts_for_category(category, request_id)
  end

  # See spec/fixtures/vcr_cassettes/clp/featured_content.json
  def featured_content
    result = {}

    FeaturedContent.fetch(id, FEATURED_CONTENT_TYPE).each do |item|
      if item[:contentType] == 'external'
        item.merge!(
          :previewImageUrl => item[:previewImage],
          :displayType => 'href'
        )
      elsif item[:contentType] == 'internal'
        view = View.find(item[:uid])
        item.merge!(view.data.slice(*%w(displayType createdAt rowsUpdatedAt viewCount)))
        item[:isPrivate] = !view.is_public? # See View class regarding semantics of is_private?
      else
        raise "Unknown featured content type: #{item[:contentType]}"
      end

      result["item#{item[:position]}".to_sym] = item
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
