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

  def description_contains_html?(display_type)
    # These types have preformatted descriptions.
    # Attempting to wrap them in <p> tags causes invalid html
    %w(data_lens data_lens_chart data_lens_map).include?(display_type)
  end

  # NOTE: This function is currently *ONLY* used to render descriptions safely.
  # It is not currently endorsed for use against other fields.
  # Please bear these facts in mind when making modifications!
  # The tags/attr list should be kept in parity with DOMPurify settings in JS.
  def sanitize_string(input)
    input = h(raw(input))
    # autolinking - uses a deprecated function, and further-deprecated syntax for that function
    input = auto_link(input, :all, {'rel' => 'nofollow external' })
    # sanitize to eliminate risky html tags and attributes
    allowed_tags = %w(a b br div em hr i p span strong sub sup u)
    allowed_attr = %w(href rel target)
    sanitize(raw(input), tags: allowed_tags, attributes: allowed_attr)
  end

  def view_formatted_description(result)
    description = result.description

    if description_contains_html?(result.display.type)
      sanitize_string(description)
    else
      view_format_description_text(description)
    end
  end

  def view_format_description_text(description, preserve_newlines = true)
    return unless description.present?
    description = simple_format(description) if preserve_newlines
    sanitize_string(description)
  end

  def a11y_browse_summary(browse_opts)
    if browse_opts[:grid_items].empty? || browse_opts[:view_results].empty?
      return t('table.no_summary_available')
    end
    columns = browse_opts[:grid_items].select { |_, val| val }.map { |key, _| %("#{key.to_s}") }
    rows = browse_opts[:view_results].map { |row| %("#{row.name}") }
    row_headings = ''
    if rows.size < 5
      row_headings = rows.join(', ')
    end

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
