# NOTE: Parts of this module duplicate facet logic in lib/browse_actions.rb incompletely
module Browse2Helper
  DEFAULT_FACET_CUTOFF = 5
  MAX_FACET_CUTOFF = 100

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

  # EN-2938: browse2 sort options are limited to Relevance, Most Accessed, Recently Added, and Recently Updated
  def browse2_sort_opts(opts)
    opts[:sort_opts].to_a.tap do |sort_opts|
      sort_opts.select! { |sort_opt| %w(relevance most_accessed newest last_modified).include?(sort_opt[:value]) }
    end
  end

  def facet_sort_option_classnames(opts, facet_option)
    facet_param = :sortBy
    facet_option_classnames(opts, facet_param, facet_option, false, false).tap do |classnames|
      # Sort by relevance by default. Apply active class to that option if there isn't an active sort present.
      classnames << ' active' if opts[facet_param] == nil && facet_option[:value] == 'relevance'
    end
  end

  def facet_sort_option(opts, sort_option, params)
    sort_option_classnames = facet_sort_option_classnames(opts, sort_option)
    sort_option_link_href = facet_option_url(opts, :sortBy, sort_option, params)

    content_tag(:li) do
      link_to(sort_option_link_href, :class => sort_option_classnames, 'data-facet-option-value' => sort_option[:value]) do
        content_tag(:span, '', :class => 'browse2-facet-option-clear-icon icon-check-2') + sort_option[:name]
      end
    end
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

  # Q: Why does this exist when lib/browse_actions.rb already has partitioning logic?
  #
  # A: Display logic does not belong in lib/browse_actions.rb. Once the old view types are EOL,
  # partitioning logic will be removed from lib/browse_actions.rb.
  #
  # Returns the facet option cutoff point. Looks at the domain configuration cutoff if set,
  # else falls back to default, 5. "View Type" is special and always shows everything.
  def browse2_facet_cutoff(facet)
    domain_cutoffs = CurrentDomain.property(:facet_cutoffs, :catalog) || {}

    facet_name = facet[:singular_description]

    if facet_name == 'type'
      MAX_FACET_CUTOFF
    elsif domain_cutoffs.keys.include?(facet_name)
      domain_cutoffs[facet_name]
    else
      # It's a custom facet
      configured_cutoff = domain_cutoffs.fetch('custom', DEFAULT_FACET_CUTOFF)

      # We need a cutoff high enough to display all summary:true options
      options = facet['options'] || []
      summary_true_cutoff = options.count { |option| option['summary'] == true }

      # summary:true trumps configured facet cutoff
      [configured_cutoff, summary_true_cutoff].max
    end.to_i # just in case someone threw in a string
  end

  # Return an array containing a combination of facet[:options] and facet[:extra_options].
  # "Topics" have the options repeated in the extra_options because of how the browse1
  # word cloud works, so reject any dupes from the returned array.
  #
  # NOTE: At this point, the partitioning from lib/browse_actions.rb is lost
  def get_all_facet_options(facet)
    sort_facet_options(
      facet[:options] + facet[:extra_options].to_a.reject do |facet_extra_option|
        facet[:options].detect { |facet_option| facet_extra_option[:value] == facet_option[:value] }
      end
    )
  end

  # Sorts facet options by summary boolean, then count, then name
  # NOTE: Only the topics facet has a count
  def sort_facet_options(facet_options)
    facet_options.to_a.sort_by do |option|
      [
        option.fetch(:summary, false) ? -1 : 1, # put summary:true options first
        -option.fetch(:count, 0), # sort topics by count
        option.fetch(:text) # alphabetize
      ]
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
    filter_params = opts[:user_params]
    filter_params[:limitTo] = opts[:limitTo] if opts[:limitTo].present?

    if opts[:facets].any? { |facet| filter_params[facet[:param]].present? }
      opts[:facets].each do |facet|
        facet_param = facet[:param]
        facet_options = (facet[:options] + facet[:extra_options].to_a).
          uniq { |option| [option[:value]] }

        if filter_params.include?(facet_param)
          clear_facet_url_params = filter_params.reject { |param| param == facet_param }

          selected_facet_option = facet_options.each do |facet_option|

            # First add any child options that match the current url params
            selected_child_option = (facet_option[:children] || []).each do |child_facet_option|
              if child_facet_option[:value] == filter_params[facet_param]
                clear_facet_options.push(
                  :label => "#{facet[:title]} > #{child_facet_option[:text]}",
                  :url => "#{opts[:base_url]}?#{clear_facet_url_params.to_param}"
                )
              end
            end

            # Then add the parent if it matches
            if facet_option[:value] == filter_params[facet_param]
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
    sort_facet_options(flattened_options)
  end

  # Returns result topics array truncated to provided limit. Also ensures that any currently
  # filtered result topic will be in the truncated result.
  def truncate_result_topics(result_topics, user_params, limit)
    truncated_results = []
    if result_topics.present?
      (0...[result_topics.length, limit].min).each do |i|
        truncated_results.push(result_topics[i])
      end
      active_tag_filter = user_params[:tags]
      # If there is an active tag filter and it isn't already in the truncated results,
      # replace the last element in truncated_results with it.
      if active_tag_filter && !truncated_results.include?(active_tag_filter)
        truncated_results[-1] = active_tag_filter
      end
    end
    truncated_results
  end

  def browse2_result_link(result_name, result_link, result_is_federated, result_link_rel_type)
    result_name << ' <span class="icon-external-square"></span>' if result_is_federated
    link_to(
      raw(result_name),
      result_link,
      class: 'browse2-result-name-link',
      rel: result_link_rel_type,
      itemprop: 'url'
    )
  end

  def browse2_result_topic_url(base_url, user_params, result_topic, federated_origin_url)
    # EN-2490: Federated result topics should link to the federated domain filtered only on the topic
    if federated_origin_url.present?
      url_params = { tags: result_topic }.to_param
      "#{federated_origin_url}#{base_url}?#{url_params}"
    else
      url_params = user_params.merge(tags: result_topic).to_param
      "#{base_url}?#{url_params}"
    end
  end
end
