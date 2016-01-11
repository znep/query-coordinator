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

end
