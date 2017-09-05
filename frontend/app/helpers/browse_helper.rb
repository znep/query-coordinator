module BrowseHelper

  def join_and_truncate_array(arr, truncation_length = 50, join_character = ',')
    return '' unless arr.present?

    str = arr.join("#{join_character} ")
    if str.length > truncation_length
      last_join_index = str.rindex(join_character, truncation_length)
      if last_join_index.nil?
        str = arr[0].to_s.slice(0, truncation_length)
      else
        str = str.slice(0, last_join_index + 2)
      end
      str += '...'
    end
    str
  end

  def view_rel_type(view, current_domain, opts)
    if view.federated?
      if current_domain.respond_to?(:feature?) && current_domain.feature?(:federated_interstitial)
        'externalDomain'
      else
        'external'
      end
    elsif opts.respond_to?(:[]) && opts[:rel_type].present?
      opts[:rel_type]
    else
      ''
    end
  end

  def view_img_alt(view, current_domain_cname)
    if view.federated?
      t('controls.browse.listing.federation_source', :source => view.domainCName)
    else
      current_domain_cname
    end
  end

  def federated_site_title(result_cname)
    if FeatureFlags.derive(nil, request)[:show_federated_site_name_instead_of_cname]
      site_theme = Configuration.find_by_type('site_theme', true, result_cname, true).first
      if site_theme.present?
        site_title = site_theme.strings.site_title
      end
    end
    site_title || result_cname
  end

  def link_for_facet(facet, facet_option, options, params)
    link_options = {}
    link_options[:class] = 'active' if facet_option[:value] == options[facet[:param]]
    link_to("#{options[:base_url]}?#{params.to_param}", link_options) do
      if facet_option[:icon]
        concat(image_tag(theme_image_url(facet_option[:icon]), :alt => 'icon', :class => 'customIcon'))
      end
      if facet_option[:text]
        concat(facet_option[:text])
      end
    end
  end

  # NOTE: This function is currently *ONLY* used to render descriptions safely.
  # It is not currently endorsed for use against other fields.
  # Please bear these facts in mind when making modifications!
  # The tags/attr list should be kept in parity with DOMPurify settings in JS.
  def sanitize_string(input, autolink: true)
    input = h(raw(input))
    # autolinking - uses a deprecated function, and further-deprecated syntax for that function
    input = auto_link(input, :all) if autolink
    # sanitize to eliminate risky html tags and attributes
    allowed_elements = %w(a b br div em hr i p span strong sub sup u)
    allowed_attributes = {
      'a' => %w(href target)
    }

    # Force all anchors to a secure rel attribute, see EN-1266.
    added_attributes = {
      'a' => { 'rel' => 'nofollow noreferrer external' }
    }

    Sanitize.fragment(
      raw(input),
      elements: allowed_elements,
      attributes: allowed_attributes,
      add_attributes: added_attributes
    ).html_safe
  end

  def view_formatted_description(result)
    if result.description.present?
      sanitize_string(simple_format(result.description, {}, :wrapper_tag => 'div'))
    end
  end

  def a11y_browse_summary(browse_opts)
    if browse_opts[:grid_items].empty? || browse_opts[:view_results].empty?
      return t('table.no_summary_available')
    end

    columns = browse_opts[:grid_items].map { | k, v | k if v }.compact.map(&:to_s).map(&:inspect)
    rows = browse_opts[:view_results].map { |row| %("#{row.name}") }
    row_headings = ''
    row_headings = rows.join(', ') if rows.size < 5

    template_opts = {
      :data_description => browse_opts[:a11y_table_description],
      :column_heading_count => columns.size,
      :column_headings => columns.join(', '),
      :row_heading_count => rows.size,
      :row_headings => row_headings
    }

    t('table.summary', template_opts)
  end

end
