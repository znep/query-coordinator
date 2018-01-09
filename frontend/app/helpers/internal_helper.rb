# This is the worst name. :(
module InternalHelper

  # ONE BUTTON FORMS
  def one_button_form(options = {}, &block)
    extra_html = capture(&block) if block_given?
    form_tag options.fetch(:url), :class => 'oneButtonForm' do
      html =
        if options.fetch(:as_button, false)
          button_tag(options.fetch(:text))
        else
          submit_tag(options.fetch(:text))
        end
      html.prepend extra_html unless extra_html.nil?
      html
    end
  end

  # OTHER STUFF
  def expandable_section(text, options = {}, &block)
    classes = %w(headerLink formSection)
    classes << 'collapsed' if options.fetch(:collapsed, true)
    html = content_tag :h2, :class => classes do
      content_tag(:span, '', :class => 'icon') << text
    end

    contents = capture(&block)
    html <<
      if options.fetch(:collapsed, true)
        content_tag(:div, contents, :class => 'collapsed')
      else
        content_tag(:div, contents)
      end
    html
  end

  def definition(term, definition, options = {})
    dd_html_options = {}
    dd_html_options[:class] = 'unknownConfigType' if options[:unknown]
    dd_html_options[:class] = 'discouragedConfigType' if options[:discouraged]
    dd_html_options[:class] = 'inheritedConfig' if options[:inherited]

    content_tag(:dt, term) + content_tag(:dd, definition, dd_html_options)
  end

  def explain_defaultness
    if @config.default
      'True: A default config is intended to be the config that systems actually read from.'
    else
      'False: A non-default config is a spare that is not intended to be read by our systems.'
    end
  end

  def explain_config_inheritance
    'This configuration, when changed, will modify other configurations which are its children. If this surprises you, ask for help!'
  end

  def autolink(value)
    if /^http/ =~ value.to_s
      link_to value, value, target: '_blank'
    else
      value
    end
  end

  def property_value(value)
    value.is_a?(String) ? value : value.to_json
  end

  def property_actions_for(property_name)
    html = selection_checkbox(:edit, property_name)
    html << selection_checkbox(:delete, property_name)
    html << selection_checkbox(:export, property_name)
  end

  def selection_checkbox(kind, property_name)
    case kind
    when :edit
      content_tag :div, :class => 'propertyAction editAction' do
        html = link_to(
          'Edit this field alone.',
          show_property_path(config_id: @config.id, property_id: property_name),
          :class => 'editLink'
        )
      end
    when :delete
      content_tag :div, :class => 'propertyAction deleteAction' do
        id  = "delete_properties[#{property_name}]"
        html = check_box_tag(id, 'delete')
        html << content_tag(
          :label,
          %Q{Delete "#{property_name}"},
          :title => property_name,
          :for => sanitize_to_id(id),
          :class => 'deleteLink'
        )
      end
    when :export
      content_tag :div, :class => 'propertyAction exportAction' do
        sanitized_id = sanitize_to_id("export[#{property_name}]")
        html = check_box_tag('', '', false, :class => 'exportCheck', :id => sanitized_id)
        html << content_tag(
          :label, %Q{Export "#{property_name}"},
          :title => property_name,
          :for => sanitized_id,
          :class => 'exportLabel'
        )
      end
    end
  end

  # SEA1 domains get federations automatically. Everyone else doesn't.
  # See: CORE-2696
  def federations_for_everyone?
    AccountTier.find_by_name('Ultimate').has_module? :federations
    #CurrentDomain.domain.accountTier.has_module? :federations
  end

  def domain_link
    link_to "#{@domain.name} (#{@domain.cname})", show_domain_path
  end

  def organization_link
    organization_name =
      if defined? @organizations
        @organizations.find { |org| org.id == @domain.organizationId }.name
      else
        content_tag(:span, @domain.organizationId, 'class' => 'organizationLink')
      end
    link_to organization_name, show_org_path(org_id: @domain.organizationId)
  end

  def enable_or_disable_module_feature(feature, enabled)
    one_button_form(url: set_features_path, as_button: true, text: enabled ? 'Disable' : 'Enable') do
      html = hidden_field_tag("features[name[#{feature}]]", feature)
      html << hidden_field_tag("features[enabled[#{feature}]]", 'enabled') unless enabled
      html
    end
  end

  def remove_module_feature(feature)
    config_id = @domain.default_configuration('feature_set').id
    one_button_form(url: set_property_path(config_id: config_id), as_button: true, text: 'Remove') do
      html = hidden_field_tag("delete_properties[#{feature}]", 'delete')
      html << hidden_field_tag("properties[#{feature}]", false)
    end
  end

  def module_notice?(feature)
    @module_notices.include?(feature)
  end

  def bulk_feature_flag_update(flags, options = {})
    flags.keep_if { |k, _| FeatureFlags.has?(k) }
    domain_flags = @domain.feature_flags
    enabling = flags.any? { |flag, value| domain_flags[flag] != value }

    button_text = options.fetch(:enable_text, 'Enable') if enabling
    button_text = options.fetch(:disable_text, 'Disable') unless enabling
    prefix = enabling ? 'feature_flags' : 'reset_to_default'

    button = one_button_form(url: update_feature_flags_path(domain_id: @domain.cname), text: button_text) do
      flags.inject(nil) do |memo, (flag, value)|
        html = hidden_field_tag("#{prefix}[#{flag}]", value)
        if memo.nil? then memo = html else memo << html end
      end
    end

    html = content_tag(:dt, button)
    description = content_tag(:span, options.fetch(:feature_description))
    warning = content_tag(
      :div,
      'Warning! Enabling will override any existing values, and resetting will not remember the previous values.',
      :class => 'warning'
    )
    html << content_tag(:dd, description << warning)
  end

  def bulk_module_feature_addition(features, options = {})
    button = one_button_form(url: add_module_feature_path, text: options.fetch(:text)) do
      features.inject(''.html_safe) do |memo, feature|
        memo << hidden_field_tag('features_to_add[]', feature)
      end
    end

    html = content_tag(:dt, button)
    html << content_tag(:dd, content_tag(:span, options.fetch(:feature_description)))
  end

  def remove_alias_button(_alias)
    aliases = @aliases - [_alias]
    one_button_form(url: update_aliases_path, text: 'Remove Alias', as_button: true) do
      hidden_field_tag('aliases', aliases.join(','))
    end
  end

  def promote_to_primary_cname_button(_alias)
    aliases = @aliases - [_alias] + [@domain.cname]
    one_button_form(url: update_aliases_path, text: 'Promote to Primary CName', as_button: true) do
      html = hidden_field_tag('aliases', aliases.join(','))
      html << hidden_field_tag('new_cname', _alias)
      html
    end
  end

  def domain_cache_time
    if Rails.env.development?
      'Dev Mode does not cache.'
    else
      CurrentDomain.last_refresh(@domain.cname) || 'Not cached yet.'
    end
  end

  def salesforce_information
    if @domain.has_valid_salesforce_id?
      link = "https://socrata.my.salesforce.com/#{@domain.salesforceId}"
      link_to link, link, target: '_blank'
    else
      if @domain.salesforceId.blank?
        'No Salesforce ID.'
      else
        %Q(Invalid Salesforce ID: "#{@domain.salesforceId}")
      end
    end
  end

  def discouragement_explanation(reason)
    content = ExternalConfig.for(:configuration_types).
      discouragement_because(reason, force_instead: true)

    content_tag(:div, content, :class => reason)
  end

  def list_of_feature_flags_as_options
    safe_join(FeatureFlags.list.sort.map do |flag|
      content_tag(:option, flag, :selected => params[:for] == flag)
    end.unshift(content_tag(:option, ' -- Choose one -- ')))
  end

  def list_of_cnames_as_links(domains)
    safe_join(
      domains.
        map(&:first).
        map { |cname| link_to(cname, feature_flags_config_path(domain_id: cname)) }.
        sort,
      ', '
    )
  end

  ## Formerly a private method in InternalController. Relocated here for testability.
  # A CName here is roughly:
  # - Something alphanumeric
  # - Can have separators: .-_
  # - Cannot have stacked separators.
  # - Cannot start/end with a separator.
  # e.g. localhost, hello.com, hello-world.com, www.hello.com
  def valid_cname?(candidate)
    (/^[a-zA-Z\d]+([a-zA-Z\d]+|\.(?!(\.|-|_))|-(?!(-|\.|_))|_(?!(_|\.|-)))*[a-zA-Z\d]+$/ =~ candidate) == 0
  end

  def can_enable_module?(module_name)
    case module_name.to_s
    when 'routing_approval', 'view_moderation'
      FeatureFlags.derive[:use_fontana_approvals] != true
    else
      true
    end
  end

  def module_error_for(module_name)
    text = module_text_for(module_name)
    [
      "#{text} cannot be enabled because this site currently has the new Approvals workflow",
      "(feature flag = 'use_fontana_approvals') enabled. These workflows manage the 'approval status' of each",
      "asset, and only one of these two workflows can be enabled at a time. NOTE: Product Development is planning",
      "to deprecate #{text} in early 2018; for more information, please ask in #discovery on Slack."
    ].join(' ')
  end

  def module_text_for(module_name)
    {
      routing_approval: 'Routing and Approval',
      view_moderation: 'View Moderation'
    }[module_name.to_sym]
  end

  def module_notice_for(module_name)
    module_text = if can_enable_module?(module_name) && module_name == 'view_moderation'
                    "#{module_text_for(module_name)} does not properly clean up when disabled, so once added you cannot remove it!"
                  elsif !can_enable_module?(module_name)
                    module_error_for(module_name)
                  end
    { module_name.to_sym => module_text }.compact.with_indifferent_access
  end

  def module_notices_for(*module_names)
    module_names.map { |module_name| module_notice_for(module_name) }.reduce({}, :merge).with_indifferent_access
  end
end
