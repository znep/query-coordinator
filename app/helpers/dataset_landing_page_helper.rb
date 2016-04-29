module DatasetLandingPageHelper
  def meta_description
    if @view.description.present?
      "#{@view.name} - #{@view.description}"
    else
      @view.name
    end
  end

  def format_date(date)
    date ? date.to_s(:dslp) : I18n.t('dataset_landing_page.metadata.no_value')
  end

  def format_number(number)
    number_with_delimiter(number)
  end

  def share_facebook_url
    "http://www.facebook.com/sharer/sharer.php?u=#{@view.encoded_seo_friendly_url(request)}"
  end

  def share_twitter_url
    if @view.attribution
      text = "#{@view.name} | #{CurrentDomain.strings.company}"
    else
      text = "#{@view.name}"
    end

    text = ERB::Util.url_encode(text)

    "http://twitter.com/share?text=#{text}&url=#{@view.encoded_seo_friendly_url(request)}"
  end

  def share_email_url
    subject = @view.name

    body = I18n.t(
      'dataset_landing_page.share.email_body',
      :provider => CurrentDomain.strings.company,
      :url => @view.encoded_seo_friendly_url(request)
    )

    "mailto:?subject=#{subject}&body=#{body}"
  end

  def export_formats
    if @view.is_geospatial? || @view.is_api_geospatial?
      return [
        { :url => @view.geo_download_path('KML'), :label => 'KML' },
        { :url => @view.geo_download_path('KMZ'), :label => 'KMZ' },
        {
          :url => @view.geo_download_path('Shapefile'),
          :label => I18n.t('dataset_landing_page.download.shapefile')
        },
        {
          :url => @view.geo_download_path('Original'),
          :label => I18n.t('dataset_landing_page.download.original')
        },
        { :url => @view.geo_download_path('GeoJSON'), :label => 'GeoJSON' }
      ]
    end

    formats = [
      { :url => @view.download_path('csv'), :label => 'CSV' },
      {
        :url => @view.download_path('csv', :bom => true),
        :label => I18n.t('dataset_landing_page.download.csv_for_excel')
      },
      { :url => @view.download_path('json'), :label => 'JSON' },
      { :url => @view.download_path('rdf'), :label => 'RDF' },
      { :url => @view.download_path('rss'), :label => 'RSS' },
      { :url => @view.download_path('xml'), :label => 'XML' }
    ]

    if FeatureFlags.derive(nil, request).enable_pdf_download_type
      formats.push({ :url => @view.download_path('pdf'), :label => 'PDF' })
    end

    if FeatureFlags.derive(nil, request).enable_xls_download_type
      formats.push({ :url => @view.download_path('xls'), :label => 'XLS' })
      formats.push({ :url => @view.download_path('xlsx'), :label => 'XLSX' })
    end

    formats
  end

  def tag_links
    (@view.tags || []).map.with_index { |tag, index|
      query = { :tag => tag }.to_query
      url = "/browse?#{query}"
      content = link_to(tag, url)
      content += ', ' if index < @view.tags.length - 1
      raw("<span>#{content}</span>")
    }.join('')
  end

  def view_icon(view)
    return 'icon-dataset' unless view.display

    case view.display.type
    when 'grouped', 'filter'
      'icon-filter'
    when 'data_lens'
      'icon-cards'
    when 'story'
      'icon-story'
    when 'map', 'intensitymap', 'geomap', 'data_lens_map'
      'icon-map'
    when 'chart', 'annotatedtimeline', 'imagesparkline', 'areachart', 'barchart', 'columnchart', 'linechart', 'piechart', 'data_lens_chart'
      'icon-bar-chart'
    else
      'icon-dataset'
    end
  end

  def data_type_metadata
    {
      :blob => {
        :icon => 'icon-data',
        :soda_type => nil
      },
      :calendar_date => {
        :icon => 'icon-date',
        :soda_type => 'floating_timestamp',
      },
      :checkbox => {
        :icon => 'icon-check',
        :soda_type => 'checkbox',
      },
      :dataset_link => {
        :icon => 'icon-link',
        :soda_type => nil,
      },
      :date => {
        :icon => 'icon-date',
        :soda_type => nil,
      },
      :document => {
        :icon => 'icon-copy-document',
        :soda_type => nil,
      },
      :drop_down_list => {
        :icon => 'icon-list-2',
        :soda_type => nil,
      },
      :email => {
        :icon => 'icon-email',
        :soda_type => 'text',
      },
      :flag => {
        :icon => 'icon-region',
        :soda_type => 'text'
      },
      :geospatial => {
        :icon => 'icon-geo',
        :soda_type => nil
      },
      :html => {
        :icon => 'icon-clear-formatting',
        :soda_type => 'text'
      },
      :line => {
        :icon => 'icon-geo',
        :soda_type => 'line'
      },
      :link => {
        :icon => 'icon-link',
        :soda_type => 'text'
      },
      :list => {
        :icon => 'icon-list-numbered',
        :soda_type => nil
      },
      :location => {
        :icon => 'icon-map',
        :soda_type => 'location'
      },
      :money => {
        :icon => 'icon-number',
        :soda_type => 'money'
      },
      :multiline => {
        :icon => 'icon-geo',
        :soda_type => 'line'
      },
      :multipoint => {
        :icon => 'icon-geo',
        :soda_type => 'point'
      },
      :multipolygon => {
        :icon => 'icon-geo',
        :soda_type => 'polygon'
      },
      :nested_table => {
        :icon => 'icon-table',
        :soda_type => nil
      },
      :number => {
        :icon => 'icon-number',
        :soda_type => 'number'
      },
      :object => {
        :icon => 'icon-data',
        :soda_type => nil
      },
      :percent => {
        :icon => 'icon-number',
        :soda_type => 'number'
      },
      :photo => {
        :icon => 'icon-chart',
        :soda_type => nil
      },
      :point => {
        :icon => 'icon-map',
        :soda_type => 'point'
      },
      :polygon => {
        :icon =>'icon-geo',
        :soda_type => 'polygon'
      },
      :stars => {
        :icon => nil,
        :soda_type => 'number'
      },
      :text => {
        :icon => 'icon-text',
        :soda_type => 'text'
      },
      :url => {
        :icon => 'icon-link',
        :soda_type => 'text'
      }
    }.with_indifferent_access
  end

  def icon_class_for_data_type(data_type)
    data_type_metadata[data_type] && data_type_metadata[data_type][:icon] || ''
  end

  def documentation_link_for_data_type(data_type)
    return '' if data_type.blank?

    data_type_text = t("dataset_landing_page.schema_preview.data_types.#{data_type}")

    soda_type = data_type_metadata[data_type] && data_type_metadata[data_type][:soda_type]

    if soda_type
      link_to(data_type_text, "https://dev.socrata.com/docs/datatypes/#{soda_type}.html", :target => 'blank')
    else
      data_type_text
    end
  end

  def schema_table_column_count
    7
  end

  def custom_metadata_fieldsets
    custom_metadata = @view.merged_metadata['custom_fields']

    return nil if custom_metadata.blank?

    merge_custom_metadata(@view).select do |fieldset|
      fieldset.fields.present? && fieldset.fields.any? do |field|
        (custom_metadata[fieldset.name] || {})[field.name].present?
      end
    end.map do |fieldset|
      fieldset.merge(existing_fields: custom_metadata.try(:assoc, fieldset.name).try(:[], 1) || {})
    end
  end
end
