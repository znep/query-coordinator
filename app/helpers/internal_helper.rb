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

    content_tag(:dt, term) + content_tag(:dd, definition, dd_html_options)
  end

  def explain_defaultness
    if @config.default
      'True: A default config is intended to be the config that systems actually read from.'
    else
      'False: A non-default config is a spare that is not intended to be read by our systems.'
    end
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
      html = hidden_field_tag('aliases', aliases.join(','))
      html << hidden_field_tag('redesigned', 'true')
      html
    end
  end

  def promote_to_primary_cname_button(_alias)
    aliases = @aliases - [_alias] + [@domain.cname]
    one_button_form(url: update_aliases_path, text: 'Promote to Primary CName', as_button: true) do
      html = hidden_field_tag('aliases', aliases.join(','))
      html << hidden_field_tag('new_cname', _alias)
      html << hidden_field_tag('redesigned', 'true')
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
end