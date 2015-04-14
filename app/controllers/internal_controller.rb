class InternalController < ApplicationController
  before_filter :check_auth

  def index
  end

  def analytics
  end

  def index_orgs
    @orgs = Organization.find()
  end

  def show_org
    @org = Organization.find(params[:id])
    @tiers = AccountTier.find()
    @domains = Organization.find().collect {|o| o.domains}.flatten.compact
    default_domain = @domains.select {|d| d.shortName == 'default'}.first
    @domains.unshift(Hashie::Mash.new(
      {'shortName' => 'default',
       'cname' =>default_domain.cname,
       'id' => default_domain.id})).flatten unless default_domain.nil?

  end

  def show_domain
    @domain = Domain.find(params[:id])
    @modules = AccountModule.find().sort {|a,b| a.name <=> b.name}
    @configs = ::Configuration.find_by_type(nil, false, params[:id], false)
  end

  def show_config
    @domain = Domain.find(params[:domain_id])
    @config = ::Configuration.find_unmerged(params[:id])
    if !@config.parentId.nil?
      @parent_config = ::Configuration.find(@config.parentId.to_s)
      @parent_domain = Domain.find(@parent_config.domainCName)
    end
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
    redirect_to '/internal/orgs/' + params[:id] + '/domains/' + domain.cname
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
        'default' => params[:config][:default].present?,
        'type' => params[:config][:type], 'parentId' => parent_id,
        'domainCName' => params[:domain_id]})
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return (render 'shared/error', :status => :internal_server_error)
    end

    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
      params[:domain_id] + '/site_config/' + config.id.to_s
  end

  def set_default_site_config
    ::Configuration.update_attributes!(params['default-site-config'],
                                     {'default' => true})

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
      params[:domain_id]
  end

  def set_features
    config = ::Configuration.find_by_type('feature_set', true, params[:domain_id])[0]
    if !params['new-feature_name'].blank?
      config.create_property(params['new-feature_name'],
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

    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
      params[:domain_id]
  end

  def add_module_to_domain
    Domain.add_account_module(params[:domain_id], params[:module][:name])

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
      params[:domain_id]
  end

  def update_aliases
    begin
      Domain.update_aliases(params[:domain_id], params[:new_cname], params[:aliases])
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return (render 'shared/error', :status => :internal_server_error)
    end
    CurrentDomain.flag_out_of_date!(params[:domain_id])
    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' + params[:new_cname]
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
      format.html { redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
        params[:domain_id] + '/site_config/' + params[:id] }
      format.data { render :json => { :success => true } }
    end
  end

  def feature_flags
    @domain = Domain.find(params[:domain_id])
    @flags = Hashie::Mash.new
    domain_flags = @domain.feature_flags
    FEATURE_FLAGS.each do |flag, fc|
      @flags[flag] = fc
      @flags[flag].value = domain_flags[flag]
    end

    respond_to do |format|
      format.html { render }
      format.data { render :json => @flags.to_json }
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
    CoreServer::Base.connection.batch_request do |batch_id|
      params['feature_flags'].each do |flag, value|
        next unless FeatureFlags.list.include? flag
        processed_value = FeatureFlags.process_value(value).to_s
        next if properties[flag] == processed_value
        if properties.has_key?(flag)
          config.update_property(flag, processed_value, batch_id)
        else
          config.create_property(flag, processed_value, batch_id)
        end
      end
    end

    CurrentDomain.flag_out_of_date!(params[:domain_id])

    respond_to do |format|
      format.html { redirect_to "/internal/orgs/#{@domain.organizationId}/domains/#{params[:domain_id]}/feature_flags" }
      format.data { render :json => { :success => true } }
    end
  end

  def flush_cache
    CurrentDomain.flag_out_of_date!(params[:domain_id])

    respond_to do |format|
      format.data { render :json => { :success => true } }
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
end
