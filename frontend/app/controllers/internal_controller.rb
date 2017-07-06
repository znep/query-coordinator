class InternalController < ApplicationController

  before_filter :check_auth
  before_filter :redirect_to_current_domain, :only => [ :show_domain, :feature_flags, :show_config, :show_property ]
  before_filter :redirect_to_default_config_id_from_type, :only => [ :show_config, :show_property ]
  skip_before_filter :require_user, :only => [ :demos ]
  skip_before_filter :check_auth, :only => [ :demos ]

  KNOWN_FEATURES = [
    { name: 'view_moderation', description: 'Allows Publishers and Admin to moderate views.' },
    { name: 'public_site_metrics', description: 'Adds a public analytics page at /analytics. See data.seattle.gov/analytics for an example; ONLY add if customer requests it.' },
    { name: 'staging_lockdown', description: 'Frontend lockdown; prevents non-superadmin users without a domain role from viewing the UX.' },
    { name: 'staging_api_lockdown', description: 'API lockdown; prevents non-superadmin users without a domain role from using the API, including the Frontend.' },
    { name: 'fullMixpanelTracking', description: 'UX metrics gathering using persistent cookies; prefer over mixpanelTracking unless customer explicitly asks for session cookies.' },
    { name: 'mixpanelTracking', description: 'UX metrics gathering using session cookies; prefer using fullMixpanelTracking when possible.' },
    { name: 'socrata_emails_bypass_auth0', description: "Don't automatically login users with @socrata.com email addresses through auth0" },
    { name: 'username_password_login', description: 'Bypass going through auth0 when doing username/password (non-SSO) logins.'},
    { name: 'disable_contact_dataset_owner', description: 'Disable contacting dataset owners in the DSLP/Primer.' },
    { name: 'disable_owner_contact', description: 'Disables showing the Contact Dataset Owner section in the About pane.' },
    { name: 'fedramp', description: 'Enables security restrictions on this domain for fedramp compliance.' },
    { name: 'pendo_tracking', description: 'Enable pendo tracker on this domain.' }
  ]

  def disable_site_chrome?
    true
  end

  def index
  end

  def analytics
  end

  def index_orgs
    @orgs = Organization.find()
  end

  def show_org
    if params[:org_id] == 'current'
      redirect_to show_org_path(org_id: CurrentDomain.domain.organizationId)
      return
    end

    @org = Organization.find(params[:org_id])
    @default_domain = Organization.find.map(&:domains).flatten.compact.detect(&:default?)
  end

  def rename_org
    if params['rename-org-to'].present?
      Organization.update_name(params[:org_id], params['rename-org-to'])
      flash[:notice] = 'Renamed organization successfully.'
    else
      flash[:error] = 'Cannot rename to an empty name.'
    end

    redirect_to show_org_path
  end

  def show_domain
    @domain = Domain.find(params[:domain_id])
    @aliases = @domain.aliases.try(:split, ',') || []
    @deleted = @domain.deletedAt.present?
    @configs = ::Configuration.find_by_type(nil, false, params[:domain_id], false)
    # Show the Feature Flag link on all pages even if it doesn't exist, because we
    # lazily create it when you make a change anyways.
    unless @configs.detect { |config| config.type == 'feature_flags' }
      @configs << Struct.new(:type, :name, :default).new('feature_flags', 'Feature Flags', true)
    end
    @configs.reject! { |config| config.type == 'feature_set' }
    @configs.sort! do |a, b|
      type_for_sort = lambda do |type|
        case type
          when 'site_theme' then '0'
          when 'feature_flags' then '1'
          else type
        end
      end
      sort_delta = type_for_sort.call(a.type) <=> type_for_sort.call(b.type)
      sort_delta = a.default ? -1 : 1 if sort_delta.zero? && a.default != b.default
      sort_delta = a.name.downcase <=> b.name.downcase if sort_delta.zero?
      sort_delta
    end

    @bulk_updates = {
      :enable_nbe => {
        disable_legacy_types: true,
        reenable_ui_for_nbe: true,
        disable_obe_redirection: true,
        disable_nbe_redirection_warning_message: true,
        enable_ingress_geometry_types: true,
        ingress_strategy: 'nbe'
      },
      :enable_govstat => [
        'canvas2', 'canvas_designer', 'govStat', 'govstat_15', 'govstat_target_tolerance'
      ]
    }

    @known_config_types = ExternalConfig.for(:configuration_types).for_autocomplete(params)
    @permanent_modules = {
      routing_approval: 'Routing and Approval does not properly clean up when disabled, so you cannot remove it.'
    }.with_indifferent_access

    @modules = (AccountModule.find + KNOWN_FEATURES).map do |duck_module|
      (duck_module.try(:as_json) || duck_module).symbolize_keys.tap do |_module|
        if @permanent_modules.key?(_module[:name])
          _module.bury(:permanent, :reason, @permanent_modules[_module[:name]])
        end
      end
    end

    respond_to do |format|
      format.json { render :json => @domain.data.to_json }
      format.html { render }
    end
  end

  def config_info
    # Include subset of ENV list, as most of it is useless. Add more as you need them
    env_variable_list = %w(RBENV_VERSION RAILS_ENV LANG)
    @config_variables_to_output = ENV.select { | key, value | env_variable_list.include?(key) }

    # Filter secret auth things
    @app_config_variables = APP_CONFIG.reject { | key, value | key.to_s.match(/auth/) }
  end

  def show_config
    @config = ::Configuration.find_unmerged(params[:config_id])
    unless @config.domainCName == params[:domain_id]
      redirect_to show_config_path(domain_id: @config.domainCName, config_id: @config.id)
      return
    end
    @domain = Domain.find(@config.domainCName)
    if @config.parentId.present?
      @parent_config = ::Configuration.find(@config.parentId.to_s)
      @parent_domain = Domain.find(@parent_config.domainCName)
    end

    type_data = ExternalConfig.for(:configuration_types)
    @type_description = type_data.description_for(@config.type)
    @property_type_checking = type_data.property_type_checking_for(@config.type)
    @usage_discouragement = type_data.discouragement_for(@config.type, params)

    @properties = @config.data['properties'].try(:sort_by, &proc { |p| p['name'] })
  end

  def show_property
    @domain = Domain.find(params[:domain_id])
    @config = ::Configuration.find_unmerged(params[:config_id])
    @property_key = params[:property_id]
    @property = @config.data['properties'].detect { |p| p['name'] == @property_key }['value']
  end

  def index_modules
    @modules = AccountModule.find
    @tiers = AccountTier.find
  end

  def index_tiers
    @tiers = AccountTier.find()
  end

  def show_tier
    @tier = AccountTier.find().select {|at| at.name == params[:name]}.first
  end

  def create_org
    begin
      params[:org][:url] = ' ' if params[:org][:url].blank?
      params[:org][:shortName] = params[:org][:name] if params[:org][:shortName].blank?
      org = Organization.create(params[:org])
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return render 'shared/error', :status => :internal_server_error
    end
    redirect_to "/internal/orgs/#{org.id}"
  end

  def create_domain
    begin
      params[:domain]['shortName'] ||= params[:domain]['cName']
      params[:domain]['accountTierId'] ||= AccountTier.find_by_name('Ultimate').id
      domain = Domain.create(params[:domain])

      parentConfigId = params[:config][:parentDomainCName]
      if parentConfigId.blank?
        parentConfigId = nil
      else
        parentConfigId = ::Configuration.find_by_type('site_theme', true, parentConfigId).first.id
      end

      ::Configuration.create(
        'name' => 'Current theme',
        'default' => true,
        'type' => 'site_theme',
        'parentId' => parentConfigId,
        'domainCName' => domain.cname
      )

      ::Configuration.create(
        'name' => 'Feature set',
        'default' => true,
        'type' => 'feature_set',
        'domainCName' => domain.cname
      )

      ::Configuration.create(
        'name' => 'Data Lens configuration',
        'type' => 'theme_v3',
        'default' => true,
        'domainCName' => domain.cname
      )

      module_features_on_by_default = %w(canvas2 geospatial staging_lockdown staging_api_lockdown)
      enabled = true
      add_module_features(module_features_on_by_default, enabled, domain.cname)

    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      status =
        case e.error_message
        when /Validation failed/ then :bad_request
        else :internal_server_error
        end
      return (render 'shared/error', :status => status)
    end

    redirect_to show_domain_path(org_id: params[:org_id], domain_id: domain.cname)
  end

  def update_domain
    if params[:org_id]
      Domain.update_organization_id(params[:domain_id], params[:org_id])
      notices << 'Successfully updated org_id.'
    end

    if params[:salesforce_id]
      Domain.update_salesforce_id(params[:domain_id], params[:salesforce_id].strip)
      notices << 'Successfully updated salesforce_id.'
    end

    if params[:new_name]
      Domain.update_name(params[:domain_id], params[:new_name])
      notices << 'Successfully updated name.'
    end

    CurrentDomain.flag_out_of_date!(params[:domain_id])
    prepare_to_render_flashes!
    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def delete_domain
    domain = Domain.find(params[:domain_id])
    if domain.present?
      Domain.delete(domain.id)
      notices << "Soft-deleted domain `#{params[:domain_id]}` successfully."
      CurrentDomain.flag_out_of_date!(params[:domain_id])
    else
      errors << "Could not find domain with cname `#{params[:domain_id]}`."
    end
    prepare_to_render_flashes!

    redirect_to show_org_path(org_id: domain.organizationId)
  end

  def undelete_domain
    domain = Domain.find(params[:domain_id])
    if domain.present?
      Domain.undelete(domain.id)
      notices << "Un-deleted domain `#{params[:domain_id]}` successfully."
      CurrentDomain.flag_out_of_date!(params[:domain_id])
    else
      errors << "Could not find domain with cname `#{params[:domain_id]}`."
    end
    prepare_to_render_flashes!

    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def create_site_config
    if params[:config][:type].blank?
      flash[:error] = 'Cannot add a configuration set with no type.'
      redirect_to show_domain_path(domain_id: params[:domain_id])
      return
    end

    begin
      conf_name = params[:config][:name]
      conf_name ||= ExternalConfig.for(:configuration_types).
        default_config_name_for(params[:config][:type])

      parent_id = params[:config][:parentId]
      parent_id = nil if parent_id.blank?
      config = ::Configuration.create(
        'name' => conf_name,
        'default' => true,
        'type' => params[:config][:type],
        'parentId' => parent_id,
        'domainCName' => params[:domain_id]
      )
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return (render 'shared/error', :status => :internal_server_error)
    end

    redirect_to show_config_path(domain_id: params[:domain_id], config_id: config.id)
  end

  def rename_site_config
    if params['rename-config-to'].present?
      ::Configuration.update_attributes!(params[:config_id], 'name' => params['rename-config-to'])
      flash[:notice] = 'Renamed config successfully.'

      CurrentDomain.flag_out_of_date!(params[:domain_id])
    else
      flash[:error] = 'Cannot rename to an empty name.'
    end

    redirect_to show_config_path
  end

  def set_default_site_config
    ::Configuration.update_attributes!(params['default-site-config'], 'default' => true)
    flash[:notice] = 'Set this config to be default for its type successfully.'

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def delete_site_config
    config = ::Configuration.find(params[:config_id])
    message = %Q(Soft-deleted configuration "#{config.name}" of type `#{config.type}` successfully.)
    ::Configuration.delete(params[:config_id])
    flash[:notice] = message

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def set_features
    config = ::Configuration.find_by_type('feature_set', true, params[:domain_id]).first
    if params['new-feature_name'].present?
      new_feature_name = params['new-feature_name'].strip
      config.create_property(new_feature_name, params['new-feature_enabled'] == 'enabled')
      notices << "Added module `#{new_feature_name}` successfully."
    else
      CoreServer::Base.connection.batch_request do |batch_id|
        params[:features][:name].each do |key, name|
          enabled = (params[:features][:enabled] || {})[name] == 'enabled'
          config.update_property(name, enabled, batch_id)
          notices << "Updated module `#{name}` to `#{enabled ? 'enabled' : 'disabled'}` successfully."
        end
      end
    end

    CurrentDomain.flag_out_of_date!(params[:domain_id])
    prepare_to_render_flashes!

    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def add_module_to_domain
    Domain.add_account_module(params[:domain_id], params[:module][:name])

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def add_a_module_feature
    if params['new-feature_name'].present?
      module_features = [ params['new-feature_name'].strip ]
      enabled = params['new-feature_enabled'] == 'enabled'
    elsif params['features_to_add'].present?
      module_features = params['features_to_add']
      enabled = true
    else
      flash[:error] = 'Did not add any modules; no modules passed in.'
      redirect_to show_domain_path(domain_id: params[:domain_id])
      return
    end

    add_module_features(module_features, enabled, params[:domain_id])

    CurrentDomain.flag_out_of_date!(params[:domain_id])
    prepare_to_render_flashes!

    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def update_aliases
    begin
      if params[:new_alias]
        domain = Domain.find(params[:domain_id])
        aliases = (domain.aliases || '').split(',').push(params[:new_alias]).join(',')
        Domain.update_aliases(params[:domain_id], domain.cname, aliases)
        notices << 'Added new alias successfully.'
      elsif params[:new_cname]

        new_cname = params[:new_cname]
        unless valid_cname?(new_cname)
          flash.now[:error] = "Invalid Primary CName: #{new_cname}"
          return render 'shared/error', :status => :internal_server_error
        end

        Domain.update_aliases(params[:domain_id], new_cname, params[:aliases])
        notices << "Set cname to `#{params[:new_cname]}`."
        notices << "Moved #{params[:domain_id]} into the aliases."
      elsif params[:aliases]
        Domain.update_aliases(params[:domain_id], params[:domain_id], params[:aliases])
        notices << 'Changed aliases successfully.'
      end
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return render 'shared/error', :status => :internal_server_error
    end
    CurrentDomain.flag_out_of_date!(params[:domain_id])
    prepare_to_render_flashes!

    cname = params[:new_cname] || params[:domain_id]
    redirect_to show_domain_path(domain_id: cname)
  end

  def set_property
    config = ::Configuration.find(params[:config_id])

    if params['new-property_name'].present?
      new_feature_name = params['new-feature_name']
      config.create_property(params['new-property_name'], get_json_or_string(params['new-property_value']))
      notices << "Created property #{new_feature_name} successfully."
    else
      begin
        CoreServer::Base.connection.batch_request do |batch_id|
          if !params[:delete_properties].nil?
            params[:delete_properties].each do |name, value|
              if value == 'delete'
                params[:properties].delete(name)
                config.delete_property(name, false, batch_id)
                notices << "Deleted property `#{name}` successfully."
              end
            end
          end

          params[:properties].each do |name, value|
            if config.raw_properties.has_key? name
              config.update_property(name, get_json_or_string(value), batch_id)
              notices << "Updated property `#{name}` successfully."
            else
              config.create_property(name, get_json_or_string(value), batch_id)
              notices << "Created property `#{name}` successfully."
            end
          end
        end
      rescue CoreServer::CoreServerError => e
        respond_to do |format|
          format.html do
            flash.now[:error] = e.error_message
            return render 'shared/error', :status => :forbidden
          end
          format.data { return render json: { error: true, message: e.error_message } }
        end
      end
    end

    CurrentDomain.flag_out_of_date!(params[:domain_id])
    prepare_to_render_flashes!

    respond_to do |format|
      format.html do
        redirect_to(
          if config.type == 'feature_set' # I'd rather check the referer...
            show_domain_path(domain_id: params[:domain_id])
          else
            show_config_path(domain_id: params[:domain_id], config_id: params[:config_id])
          end
        )
      end
      format.data { render :json => { :success => true } }
    end
  end

  def feature_flag_report
    if FeatureFlags.has?(params[:for])
      report = FeatureFlags.report(params[:for])
      @description = FeatureFlags.description_for(params[:for])
      @default = report['default']
      @environment = Signaller::Utils.process_value(report['environment'])
      @domains = report['domains'] || []
    else
      @version_information = Signaller.full_version_information
    end
  end

  def set_environment_feature_flag
    update_feature_flags(params, nil)

    redirect_to feature_flag_report_path(for: params[:feature_flags].keys.first)
  end

  def feature_flags
    @domain = Domain.find(params[:domain_id])
    @flags = Hashie::Mash.new
    domain_flags = @domain.feature_flags
    category = params[:category].try(:gsub, '+', ' ')
    FeatureFlags.each do |flag, fc|
      next unless category.nil? || category == fc['category']
      @flags[flag] = fc
      @flags[flag].value = domain_flags[flag]
    end

    respond_to do |format|
      format.html { render }
      format.data { render :json => @flags.to_json }
      format.json { render :json => @flags.to_json }
    end
  end

  def signaller_version
    render :json => Signaller.read_from(Signaller::Endpoint.for(:version))
  end

  def set_feature_flags
    update_feature_flags(params, params[:domain_id])
    CurrentDomain.flag_out_of_date!(params[:domain_id])

    prepare_to_render_flashes!
    respond_to do |format|
      format.html do
        redirect_to feature_flags_config_path(domain_id: params[:domain_id], category: params[:category])
      end

      json_response = { :success => errors.empty?, :errors => errors, :infos => notices }
      format.data { render :json => json_response }
      format.json { render :json => json_response }
    end
  end

  def update_feature_flags_on_multiple_domains
    auth_header = { 'Cookie' => "_core_session_id=#{User.current_user.session_token}" }
    flag = Signaller.for(flag: params[:flag])

    valid_url_characters = '\w\.\-_'
    domain_list = params[:domains].presence || params[:domain_list].try do |list|
      list.split(/[^#{valid_url_characters}]+/).reject(&:blank?) # i.e., dump any commas
    end

    dry_run = ''
    dry_run << '[Dry Run] ' if params[:dry_run]

    begin
      raise 'Both :domains and :domain_list were empty.' if domain_list.blank?
      domain_list.sort!

      case params[:commit]
        when 'Set'
          processed_value = Signaller::Utils.process_value(params[:multiple_domains][params[:flag]])
          changed_domains = begin
            flag.set_multiple(
              to_value: processed_value,
              on_domains: domain_list,
              authorization: auth_header
            ) unless params[:dry_run]
            domain_list
          rescue Signaller::ProcessingIncomplete => e
            (domain_list - e.remaining_items).tap do |list|
              errors << "Job incomplete. Only processed #{list.size} domains."
              errors << "Remaining: #{e.remaining_items.join(', ')}"
            end
          end
          changed_domains.each do |domain|
            notices << %Q{#{dry_run}#{params[:flag]} was set with value "#{processed_value}" on #{domain}.}
          end
        when 'Reset'
          changed_domains = begin
            flag.reset_multiple(
              on_domains: domain_list,
              authorization: auth_header
            ) unless params[:dry_run]
            domain_list
          rescue Signaller::ProcessingIncomplete => e
            (domain_list - e.remaining_items).tap do |list|
              errors << "Job incomplete. Only processed #{list.size} domains."
              errors << "Remaining: #{e.remaining_items.join(', ')}"
            end
          end

          changed_domains.each do |domain|
            notices << %Q{#{dry_run}#{params[:flag]} was reset to its default value of "#{FeatureFlags.default_for(params[:flag])}" on #{domain}.}
          end
      end
    rescue => e
      err_msg = "#{params[:flag]} could not be changed."
      err_msg << " Reason: #{e.message}."
      errors << err_msg
    end
    prepare_to_render_flashes!
    redirect_to feature_flag_report_path(:for => params[:flag])
  end

  def flush_cache
    CurrentDomain.flag_out_of_date!(params[:domain_id])

    respond_to do |format|
      format.data { render :json => { :success => true } }
    end
  end

  def domains_summary
    summary = Domain.all.map{ |domain| { :id => domain.id, :name => domain.name, :cname => domain.cname, :shortName => domain.shortName, :aliases => domain.aliases } }

    respond_to do |format|
      format.data { render :json => summary }
      format.json { render :json => summary }
    end
  end

  def organization_list
    summary = Organization.find.
      map { |org| { id: org.id, name: org.name } }.
      # Sort numbers, then case-insensitive alphas, then underscores.
      sort_by { |o| o[:name].upcase }

    respond_to do |format|
      format.data { render :json => summary }
      format.json { render :json => summary }
    end
  end

  def find_deleted_user
    if params[:email]
      begin
        @deleted_user = User.find_deleted_user(params[:email])
      rescue CoreServer::ResourceNotFound
        errors << "User with email #{params[:email]} does not exist, or is not deleted."
        prepare_to_render_flashes!
      end
    end
  end

  def undelete_user
    User.undelete(params[:uid_to_undelete])
    notices << "User successfully undeleted!"
    prepare_to_render_flashes!

    redirect_to find_deleted_user_path
  end

  private

  def check_auth
    # This doesn't seem to work the way the original author expected it to work.
    # The require_user filter (ApplicationController) is already executed before
    # the check_auth filter, so current_user is always present and therefore
    # this line has no effect.
    #
    # However, I'm not removing this line just yet because the solution to a
    # piecemeal authorization system is not a proliferation of piecemeal edits,
    # especially involving formerly untested code.
    return require_user(true) unless current_user.present?

    unless current_user.is_superadmin?
      flash.now[:error] = 'You do not have permission to view this page'
      render 'shared/error', :status => :forbidden
    end
  end

  def get_json_or_string(value)
    # well, if it doesn't parse it must be a string, right?
    # </famous-last-words>
    begin
      new_value = JSON.parse(value)
    rescue JSON::ParserError
      new_value = value.gsub(/(\\u000a)|(\\+n)/, "\n") # avoid double-escaping
    end
    new_value
  end

  ##
  # Hand it a string, it hands you back a yes/no answer.
  # A CName here is roughly:
  # - Something alphanumeric
  # - Can have separators: .-_
  # - Cannot have stacked separators.
  # - Cannot start/end with a separator.
  # e.g. localhost, hello.com, hello-world.com, www.hello.com
  def valid_cname?(candidate)
    (/^[a-zA-Z\d]+([a-zA-Z\d]+|\.(?!(\.|-|_))|-(?!(-|\.|_))|_(?!(_|\.|-)))*[a-zA-Z\d]+$/ =~ candidate) == 0
  end

  def editing_this_page_is_dangerous?(domain = @domain)
    case
      #when Rails.env.development? then false
      when domain.has_child_domains? then :child_domains
      when %w(socrata default).include?(domain.shortName) then :short_name
    end
  end
  helper_method :editing_this_page_is_dangerous?

  def add_module_features(module_features, enabled, domain_cname)
    module_features.try(:each) do |feature|
      feature_is_a_module = AccountModule.include?(feature)
      module_already_added = Domain.find(domain_cname, true).modules.include?(feature)
      if feature_is_a_module && !module_already_added
        Domain.add_account_module(domain_cname, feature)
        notices << "Added account module `#{feature}` successfully."
      end
      config = ::Configuration.find_by_type('feature_set', true, domain_cname).first

      if config.nil?
        # This problem can honestly just be fixed by creating the feature_set config.
        # If you have encountered this issue, verify that everything that's normally added
        # upon domain creation has been done with this domain.
        #
        # Consider dynamically creating this config in the future?
        errors << 'Config `feature_set` does not exist! Please ask Engineering to investigate.'
        break
      end

      if config.properties.keys.include? feature
        config.update_property(feature, enabled)
        notices << "Updated feature `#{feature}` as `#{enabled}` successfully."
      else
        config.create_property(feature, enabled)
        notices << "Created feature `#{feature}` as `#{enabled}` successfully."
      end
    end
  end

  def update_feature_flags(updates, domain_cname)
    domain = (Domain.find(domain_cname) unless domain_cname.nil?)

    if FeatureFlags.using_signaller?
      updates['feature_flags'].try(:each) do |flag, value|
        begin
          if updates['reset_to_default'].try(:[], flag)
            message = %Q{reset to its default value of "#{FeatureFlags.default_for(flag)}".}
            FeatureFlags.reset_value(flag, domain: domain_cname)
          else
            processed_value = Signaller::Utils.process_value(value)
            message = %Q{set with value "#{processed_value}".}
            FeatureFlags.set_value(flag, processed_value, domain: domain_cname)
          end
          notices << "#{flag} was #{message}"
        rescue => e
          err_msg = "#{flag} could not be #{message}"
          err_msg << " Reason: #{e.message}."
          errors << err_msg
        end
      end
    else # if not using signaller

      config = domain.default_configuration('feature_flags')

      # If the cname is different, then this is a merged parent domain's config and
      # consequently means we'd be setting the properties on the wrong config object.
      # If `config` is wrong in any way, that means it doesn't exist and we should create it.

      if config.nil? || (config && config.domainCName != domain.cname)
        begin
          config = ::Configuration.create(
            'name' => 'Feature Flags',
            'default' => true,
            'type' => 'feature_flags',
            'parentId' => nil,
            'domainCName' => domain_cname
          )
        rescue CoreServer::CoreServerError => e
          flash.now[:error] = e.error_message
          return (render 'shared/error', :status => :internal_server_error)
        end
      end

      properties = config.properties
      CoreServer::Base.connection.batch_request do |batch_id|
        (updates['feature_flags'] || []).each do |flag, value|
          unless FeatureFlags.list.include?(flag)
            errors << "#{flag} is not a valid feature flag."
            next
          end
          processed_value = Signaller::Utils.process_value(value).to_s
          if properties[flag] == processed_value
            notices << %Q{#{flag} was already set to "#{processed_value}".}
            next
          end
          if properties.has_key?(flag)
            config.update_property(flag, processed_value, batch_id)
            notices << %Q{#{flag} was updated with value "#{processed_value}".}
          else
            config.create_property(flag, processed_value, batch_id)
            notices << %Q{#{flag} was created with value "#{processed_value}".}
          end
        end

        (updates['reset_to_default'] || {}).keys.each do |flag|
          if config.has_property?(flag)
            config.delete_property(flag, false, batch_id)
            default_value = FeatureFlags.default_for(flag).to_s
            notices << %Q{#{flag} was reset to its default value of "#{default_value}".}
          else
            # Failure is not an error.
            notices << "#{flag} could not be reset since it was not set in the first place."
          end
        end
      end
    end
  end

  def notices
    (@flashes ||= {})[:notice] ||= []
  end

  def errors
    (@flashes ||= {})[:error] ||= []
  end

  def prepare_to_render_flashes!
    if @flashes.present?
      flash[:notice] = @flashes[:notice].join('|') unless @flashes[:notice].blank?
      flash[:error] = @flashes[:error].join('|') unless @flashes[:error].blank?
    end
  end

  def redirect_to_current_domain
    if params[:domain_id] == 'current'
      redirect_to url_for(params.merge(domain_id: CurrentDomain.cname))
    end
  end

  # It is often aggravating to figure out the ID of a particular configuration.
  # Instead, this makes it so that you can be redirected to the default configuration
  # on a domain for that config type.
  #
  # For example /site_config/catalog on the opendata.socrata.com domain will redirect you to
  # /domains/opendata.socrata.com/site_config/1200 because that's the default config.
  def redirect_to_default_config_id_from_type
    # If you put in a config type into the :config_id, it'll redirect to the default config!
    config_type = params[:config_id]
    unless config_type.match /^\d+$/
      config = ::Configuration.find_by_type(config_type, true, params[:domain_id], false).first
      return render_404 if config.nil?
      redirect_to url_for(params.merge(config_id: config.id))
    end
  end
end
