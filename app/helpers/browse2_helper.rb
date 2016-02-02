module Browse2Helper

  def facet_option_is_active?(opts, facet_param, facet_option)
    opts[facet_param] == facet_option[:value]
  end

  def facet_option_classnames(opts, facet_param, facet_option, is_child_option, has_child_options)
    classes = is_child_option ? ['browse2-facet-section-child-option'] : ['browse2-facet-section-option']
    classes << facet_option[:class] if facet_option[:class]
    classes << 'active' if facet_option_is_active?(opts, facet_param, facet_option)
    classes << 'has-child-options' if has_child_options
    classes.join(' ')
  end

  def facet_option_url(opts, facet_param, facet_option, params)
    current_params = opts[:user_params].dup
    if params[:view_type] == 'browse2'
      current_params[:view_type] = 'browse2'
    end

    if opts[:strip_params] && opts[:strip_params][facet_param.to_sym]
      current_params.delete_if do |key, value|
        opts[:strip_params][facet_param.to_sym][key.to_sym].present?
      end
    end

    current_params[facet_param.to_sym] = facet_option[:value]

    # If current facet_option is active, then remove the the facet_param from
    # its url, so that clicking active filters removes the filter.
    if facet_option_is_active?(opts, facet_param, facet_option)
      current_params.reject! do |param|
        param == facet_param
      end
    end
    "#{opts[:base_url]}?#{current_params.to_param}"
  end

  # Return an array containing a combination of facet[:options] and facet[:extra_options].
  # "Topics" have the options repeated in the extra_options because of how the browse1
  # word cloud works, so reject any dupes from the returned array.
  def get_all_facet_options(facet)
    facet[:options] + facet[:extra_options].to_a.reject do |facet_extra_option|
      facet[:options].detect { |facet_option| facet_extra_option[:value] == facet_option[:value] }
    end
  end

  def active_facet_option(active_option, facet)
    if active_option.present?
      facet_options = facet[:options] + facet[:extra_options].to_a
      facet_options.map do |option|
        [option] + option.fetch(:children, [])
      end.flatten.detect do |option|
        option[:value] == active_option
      end
    end
  end

  def get_clear_facet_options(opts)
    clear_facet_options = []

    if opts[:facets].any? { |facet| opts[:user_params][facet[:param]].present? }

      opts[:facets].each do |facet|
        facet_param = facet[:param]
        facet_options = (facet[:options] + facet[:extra_options].to_a).
          uniq { |option| [option[:value]] }

        if opts[:user_params].include?(facet_param)
          clear_facet_url_params = opts[:user_params].reject { |param| param == facet_param }

          selected_facet_option = facet_options.each do |facet_option|

            # First add any child options that match the current url params
            selected_child_option = (facet_option[:children] || []).each do |child_facet_option|
              if child_facet_option[:value] == opts[:user_params][facet_param]
                clear_facet_options.push(
                  :label => "#{facet[:title]} > #{child_facet_option[:text]}",
                  :url => "#{opts[:base_url]}?#{clear_facet_url_params.to_param}"
                )
              end
            end

            # Then add the parent if it matches
            if facet_option[:value] == opts[:user_params][facet_param]
              clear_facet_options.push(
                :label => "#{facet[:title]} > #{facet_option[:text]}",
                :url => "#{opts[:base_url]}?#{clear_facet_url_params.to_param}"
              )
            end
          end
        end
      end
    end
    clear_facet_options
  end

  # Moves child facet options into top level options. Only looks 1 level deep because that's all
  # the nesting we allow.
  def flatten_facet_options(facet_options)
    flattened_options = []
    facet_options.to_a.each do |option|
      new_option = { :value => option[:value], :text => option[:text] }
      new_option[:count] = option[:count] || 0
      flattened_options.push(new_option)
      option[:children].to_a.each do |child_option|
        new_child_option = { :value => child_option[:value], :text => child_option[:text] }
        new_child_option[:count] = child_option[:count] || 0
        flattened_options.push(new_child_option)
      end
    end
    flattened_options
  end
end
