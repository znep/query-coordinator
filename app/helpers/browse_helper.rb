module BrowseHelper

  def join_and_truncate_array(arr, truncation_length = 50, join_character = ',')
    return '' if arr.empty?

    str = arr.join("#{join_character} ")
    if str.length > truncation_length
      last_join_index = str.rindex(join_character, truncation_length)
      if last_join_index.nil?
        str = arr[0].slice(0, truncation_length)
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

  def view_format_description_text(description, preserve_newlines = true)
    description = simple_format(description) if preserve_newlines
    sanitize raw(auto_link(h(raw(description)), :all, {'rel' => 'nofollow external' }))
  end

end
