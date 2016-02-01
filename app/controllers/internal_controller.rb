class InternalController < ApplicationController
  before_filter :check_auth

  def index
  end

  def analytics
  end

  def index_orgs
    @orgs = Organization.find()
  end

  TIERS_WE_STILL_USE = [ 'Plus', 'Ultimate' ]
  def show_org
    @org = Organization.find(params[:id])
    @tiers = AccountTier.find().select { |tier| TIERS_WE_STILL_USE.include?(tier.name) }
    @domains = Organization.find().collect {|o| o.domains}.flatten.compact
    default_domain = @domains.select {|d| d.shortName == 'default'}.first
    @domains.unshift(Hashie::Mash.new(
      {'shortName' => 'default',
       'cname' =>default_domain.cname,
       'id' => default_domain.id})).flatten unless default_domain.nil?

  end

  def show_domain
    @domain = Domain.find(params[:domain_id])
    @modules = AccountModule.find().sort {|a,b| a.name <=> b.name}
    @configs = ::Configuration.find_by_type(nil, false, params[:domain_id], false)
    # Show the Feature Flag link on all pages even if it doesn't exist, because we
    # lazily create it when you make a change anyways.
    unless @configs.detect { |config| config.type == 'feature_flags' }
      @configs << Struct.new(:type).new('feature_flags')
    end
    @configs.sort! do |a, b|
      type_for_sort = lambda do |type|
        case type
        when 'site_theme';    '0'
        when 'feature_flags'; '1'
        else;                 type
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
        enable_export_service: true,
        reenable_ui_for_nbe: true,
        disable_obe_redirection: true,
        disable_nbe_redirection_warning_message: true,
        enable_ingress_geometry_types: true,
        geo_imports_to_nbe_enabled: true,
        ingress_strategy: 'delta-importer'
      }
    }

    @known_config_types = ExternalConfig.for(:configuration_types).
      type_descriptions.
      reject { |type, description| description.try(:[], 'hide_in_creation_ui') }.
      inject([]) do |memo, (type, description)|
        description ||= {}
        description['description'] ||= %q(Haven't written a description yet.)
        description.keys.each do |key|
          description[key] =
            case description[key]
            when Array then description[key].join(', ')
            else description[key]
            end
        end
        memo << description.merge({ name: type })
        memo
      end
  end

  def config_info
    # Include subset of ENV list, as most of it is useless. Add more as you need them
    env_variable_list = %w{ RBENV_VERSION RAILS_ENV LANG }
    @config_variables_to_output = ENV.select { | key, value | env_variable_list.include?(key) }

    # Filter secret auth things
    @app_config_variables = APP_CONFIG.reject { | key, value | key.to_s.match(/auth/) }
  end

  def show_config
    @domain = Domain.find(params[:domain_id])
    @config = ::Configuration.find_unmerged(params[:id])
    if @config.parentId.present?
      @parent_config = ::Configuration.find(@config.parentId.to_s)
      @parent_domain = Domain.find(@parent_config.domainCName)
    end

    @type_description = ExternalConfig.for(:configuration_types).
      type_descriptions[@config.type]
  end

  def show_property
    @domain = Domain.find(params[:domain_id])
    @config = ::Configuration.find_unmerged(params[:config_id])
    @property_key = params[:property_id]
    @property = @config.data['properties'].detect {|p| p['name'] == @property_key}['value']
  end

  def index_modules
    @modules = AccountModule.find().sort {|a,b| a.name <=> b.name}
    @tiers = AccountTier.find()
  end

  def index_tiers
    @tiers = AccountTier.find()
  end

  def show_tier
    @tier = AccountTier.find().select {|at| at.name == params[:name]}[0]
  end


  def create_org
    begin
      org = Organization.create(params[:org])
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return (render 'shared/error', :status => :internal_server_error)
    end
    redirect_to '/internal/orgs/' + org.id.to_s
  end

  def create_domain
    begin
      domain = Domain.create(params[:domain])

      parentConfigId = params[:config][:parentDomainCName]
      if parentConfigId.blank?
        parentConfigId = nil
      else
        parentConfigId = ::Configuration.find_by_type('site_theme', true,
                                                    parentConfigId)[0].id
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

    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return (render 'shared/error', :status => :internal_server_error)
    end
    redirect_to show_domain_path(org_id: params[:id], domain_id: domain.cname)
  end

  def create_site_config
    begin
      conf_name = params[:config][:name]
      if conf_name.blank?
        flash.now[:error] = 'Name is required'
        return (render 'shared/error', :status => :internal_server_error)
      end

      parent_id = params[:config][:parentId]
      parent_id = nil if parent_id.blank?
      config = ::Configuration.create({'name' => conf_name,
        'default' => true,
        'type' => params[:config][:type], 'parentId' => parent_id,
        'domainCName' => params[:domain_id]})
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return (render 'shared/error', :status => :internal_server_error)
    end

    redirect_to show_config_path(domain_id: params[:domain_id],
                                 id: config.id)
  end

  def rename_site_config
    ::Configuration.update_attributes!(params['rename-config'],
                                       { 'name' => params['rename-config-to'] })

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    redirect_to show_config_path(domain_id: params[:domain_id],
                                 id: params['rename-config'])
  end

  def set_default_site_config
    ::Configuration.update_attributes!(params['default-site-config'],
                                     {'default' => true})

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def delete_site_config
    ::Configuration.delete(params[:id])

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def set_features
    config = ::Configuration.find_by_type('feature_set', true, params[:domain_id])[0]
    if !params['new-feature_name'].blank?
      config.create_property(params['new-feature_name'].strip,
                             params['new-feature_enabled'] == 'enabled')
    else
      CoreServer::Base.connection.batch_request do |batch_id|
        params[:features][:name].each do |key, name|
          config.update_property(name,
                              (params[:features][:enabled] || {})[name] == 'enabled', batch_id)
        end
      end
    end

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def add_module_to_domain
    Domain.add_account_module(params[:domain_id], params[:module][:name])

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    redirect_to show_domain_path(domain_id: params[:domain_id])
  end

  def update_aliases
    new_cname = params[:new_cname].strip

    begin
      unless valid_cname?(new_cname)
        flash.now[:error] = "Invalid Primary CName: #{new_cname}"
        return render 'shared/error', :status => :internal_server_error
      end

      Domain.update_aliases(params[:domain_id], new_cname, params[:aliases])
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return render 'shared/error', :status => :internal_server_error
    end
    CurrentDomain.flag_out_of_date!(params[:domain_id])
    redirect_to show_domain_path(domain_id: new_cname)
  end


  def set_property
    config = ::Configuration.find(params[:id])

    if !params['new-property_name'].blank?
      config.create_property(params['new-property_name'],
                           get_json_or_string(params['new-property_value']))

    else
      begin
        CoreServer::Base.connection.batch_request do |batch_id|
          if !params[:delete_properties].nil?
            params[:delete_properties].each do |name, value|
              if value == 'delete'
                params[:properties].delete(name)
                config.delete_property(name, false, batch_id)
              end
            end
          end

          params[:properties].each do |name, value|
            config.update_property(name, get_json_or_string(value), batch_id)
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

    respond_to do |format|
      format.html { redirect_to show_config_path(domain_id: params[:domain_id],
                                                 id: params[:id]) }
      format.data { render :json => { :success => true } }
    end
  end

  FLAG_SETS = {
    'data lens' => ['data_lens_transition_state'] # just an example
  }.merge(FeatureFlags.categories)

  DOMAIN_SETS = {
    'yeah i dunno' => [ 'localhost' ] # just an example
  }

  def feature_flags_across_domains
    domains = (params[:domains].try(:split, ',') || []).
      collect { |domain| DOMAIN_SETS[domain] || domain }.
      flatten.
      collect { |domain| Domain.find(domain) rescue nil }.
      compact

    domains << CurrentDomain.domain if domains.empty?

    category = params[:flag_set].try(:gsub, '+', ' ')
    @category = category if FeatureFlags.categories.keys.include? category

    @flags = (params[:flags].try(:split, ',') || []) + Array(FLAG_SETS[category])
    @flags.select! { |flag| FeatureFlags.has? flag }

    @sets = FLAG_SETS

    # Defaulting this to 'data lens' is artbitrary. We include it because
    # the UI looks funky without it, but ideally we should have a default category
    # already set in feature_flags.yml that we could use instead.
    # TODO: Add a 'default' or 'uncategorized' category to feature_flags.yml to use here
    if @flags.empty?
      @category = 'data lens'
      @flags = @sets[@category]
    end

    @domains = domains.inject({}) do |memo, domain|
      memo[domain] = domain.feature_flags.keep_if { |k, _| @flags.include? k }
      memo
    end
  end

  def feature_flags
    @domain = Domain.find(params[:domain_id])
    @flags = Hashie::Mash.new
    domain_flags = @domain.feature_flags
    category = params[:category].try(:gsub, '+', ' ')
    ExternalConfig.for(:feature_flag).each do |flag, fc|
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

  def set_feature_flags
    @domain = Domain.find(params[:domain_id])
    config = @domain.default_configuration('feature_flags')

    if config.nil?
      begin
        config = ::Configuration.create(
          'name' => 'Feature Flags',
          'default' => true,
          'type' => 'feature_flags',
          'parentId' => nil,
          'domainCName' => params[:domain_id]
        )
      rescue CoreServer::CoreServerError => e
        flash.now[:error] = e.error_message
        return (render 'shared/error', :status => :internal_server_error)
      end
    end

    properties = config.properties
    infos = []
    errors = []
    CoreServer::Base.connection.batch_request do |batch_id|
      (params['feature_flags'] || []).each do |flag, value|
        unless FeatureFlags.list.include? flag
          errors << "#{flag} is not a valid feature flag."
          next
        end
        processed_value = FeatureFlags.process_value(value).to_s
        if properties[flag] == processed_value
          infos << "#{flag} was already set to \"#{processed_value}\"."
          next
        end
        if properties.has_key?(flag)
          config.update_property(flag, processed_value, batch_id)
          infos << "#{flag} was updated with value \"#{processed_value}\"."
        else
          config.create_property(flag, processed_value, batch_id)
          infos << "#{flag} was created with value \"#{processed_value}\"."
        end
      end

      (params['reset_to_default'] || {}).keys.each do |flag|
        if config.has_property?(flag)
          config.delete_property(flag, false, batch_id)
          default_value = FeatureFlags.default_for(flag).to_s
          infos << "#{flag} was reset to its default value of \"#{default_value}\"."
        else
          # Failure is not an error.
          infos << "#{flag} could not be reset; it was not set in the first place."
        end
      end
    end

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    flash[:error] = errors.join('|') unless errors.empty?
    flash[:notice] = infos.join('|') unless infos.empty?

    respond_to do |format|
      format.html do
        redirect_to feature_flags_config_path(domain_id: params[:domain_id],
                                              category: params[:category])
      end

      json_response = { :success => errors.empty?, :errors => errors, :infos => infos }
      format.data { render :json => json_response }
      format.json { render :json => json_response }
    end
  end

  def flush_cache
    CurrentDomain.flag_out_of_date!(params[:domain_id])

    respond_to do |format|
      format.data { render :json => { :success => true } }
    end
  end

  def domains_summary
    summary = Domain.all.map{ |domain| { :id => domain.id, :name => domain.name, :cname => domain.cname, :shortName => domain.shortName } }

    respond_to do |format|
      format.data { render :json => summary }
      format.json { render :json => summary }
    end
  end

private
  def check_auth
    if current_user.nil?
      return require_user(true)
    elsif !current_user.flag?('admin')
      flash.now[:error] = "You do not have permission to view this page"
      return (render 'shared/error', :status => :forbidden)
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
    return new_value
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
    !Rails.env.development? && [ 'default', 'socrata' ].include?(domain.shortName)
  end
  helper_method :editing_this_page_is_dangerous?

end
