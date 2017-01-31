class CatalogLandingPage

  CONFIGURATION_TYPE = 'catalog_landing_page'
  FEATURED_CONTENT_TYPE = 'catalog_query'
  REQUIRED_METADATA_KEYS = %w(headline description)

  attr_reader :cname, :id

  # 'domain_or_cname' is either a Domain instance or the cname string.
  # 'id' is the identifier of the specific CLP (e.g. 'category=Government', 'salt-lake-city', etc.)
  def initialize(domain_or_cname, id)
    @cname = domain_or_cname.respond_to?(:cname) ? domain_or_cname.cname : domain_or_cname
    @id = id.is_a?(Hash) ? CGI.escape!(Constraints::CatalogLandingPageConstraint.catalog_query(id)) : id
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

  def category_stats(category)
    Cetera::Utils.get_lens_counts_for_category(category)
  end

  # See spec/fixtures/vcr_cassettes/clp/featured_content.json
  def featured_content
    FeaturedContent.fetch(id, FEATURED_CONTENT_TYPE).each do |item|
      if item[:contentType] == 'external'
        item.merge!(
          :previewImageUrl => "https://#{CurrentDomain.cname}/api/views/2jnm-ghyx/files/#{item[:previewImage]}",
          :displayType => 'href'
        )
      elsif item[:contentType] == 'internal'
        uid = item[:url][-9..-1]
        view = View.find(uid)
        item.merge!(view.data.slice(*%w(displayType createdAt rowsUpdatedAt viewCount)))
        item[:id] = uid
        item[:isPrivate] = !view.is_public? # See View class regarding semantics of is_private?
      else
        raise "Unknown featured content type: #{item[:contentType]}"
      end
    end
  end

  def create_or_update_featured_content(featured_item)
    FeaturedContent.create_or_update(id, FEATURED_CONTENT_TYPE, featured_item)
  end

  def delete_featured_content(item_position)
    FeaturedContent.destroy(id, FEATURED_CONTENT_TYPE, item_position)
  end

  private

  def configuration
    Configuration.find_or_create_by_type(CONFIGURATION_TYPE)
  end

end

