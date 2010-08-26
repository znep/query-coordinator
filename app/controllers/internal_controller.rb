class InternalController < ApplicationController
  before_filter :check_auth
  layout 'dataset_v2'

  def index
  end

  def index_orgs
    @orgs = Organization.find()
  end

  def show_org
    @org = Organization.find(params[:id])
    @tiers = Accounttier.find()
    @domains = Organization.find().collect {|o| o.domains}.flatten.compact
    default_domain = @domains.select {|d| d.shortName == 'socrata'}.first
    @domains.unshift(Hashie::Mash.new(
      {'shortName' => 'Default (socrata)',
       'cname' =>default_domain.cname,
       'id' => default_domain.id})).flatten unless default_domain.nil?

  end

  def show_domain
    @domain = Domain.find(params[:id])
    @modules = Accountmodule.find().sort {|a,b| a.name <=> b.name}
  end

  def show_config
    @domain = Domain.find(params[:domain_id])
    @config = Configuration.find_unmerged(params[:id])
    if !@config.parentId.nil?
      @parent_config = Configuration.find(@config.parentId.to_s)
      @parent_domain = Domain.find(@parent_config.domainCName)
    end
  end

  def show_property
    @domain = Domain.find(params[:domain_id])
    @config = Configuration.find_unmerged(params[:config_id])
    @property_key = params[:property_id]
    @property = @config.data['properties'].detect {|p| p['name'] == @property_key}['value']
  end

  def index_modules
    @modules = Accountmodule.find().sort {|a,b| a.name <=> b.name}
    @tiers = Accounttier.find()
  end

  def index_tiers
    @tiers = Accounttier.find()
  end

  def show_tier
    @tier = Accounttier.find().select {|at| at.name == params[:name]}[0]
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
        parentConfigId = Configuration.find_by_type('site_theme', true,
                                                    parentConfigId)[0].id
      end

      site_theme = Configuration.create({'name' => 'Current theme',
        'default' => true, 'type' => 'site_theme', 'parentId' => parentConfigId,
        'domainCName' => domain.cname})
      Configuration.create({'name' => 'Feature set',
        'default' => true, 'type' => 'feature_set', 'domainCName' => domain.cname})

      site_theme.create_property('sdp_template', WidgetCustomization.create_default!.uid)

    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return (render 'shared/error', :status => :internal_server_error)
    end
    redirect_to '/internal/orgs/' + params[:id] + '/domains/' + domain.cname
  end

  def preview_site_config
    conf_id = params[:config_id]
    conf_id = nil if conf_id == 'nil' || conf_id.blank?
    session[:custom_site_config] = conf_id

    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
      params[:domain_id]
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
      config = Configuration.create({'name' => conf_name,
        'default' => false, 'type' => 'site_theme', 'parentId' => parent_id,
        'domainCName' => params[:domain_id]})
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return (render 'shared/error', :status => :internal_server_error)
    end

    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
      params[:domain_id] + '/site_config/' + config.id.to_s
  end

  def set_default_site_config
    Configuration.update_attributes!(params['default-site-config'],
                                     {'default' => true})

    CurrentDomain.flag_domain_id_out_of_date!(params[:domain_id])

    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
      params[:domain_id]
  end

  def set_features
    config = Configuration.find_by_type('feature_set', true, params[:domain_id])[0]
    if !params['new-feature_name'].blank?
      config.create_property(params['new-feature_name'],
                             params['new-feature_enabled'] == 'enabled')
    else
      CoreServer::Base.connection.batch_request do
        params[:features][:name].each do |key, name|
          config.update_property(name,
                              params[:features][:enabled][name] == 'enabled')
        end
      end
    end

    CurrentDomain.flag_domain_id_out_of_date!(params[:domain_id])

    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
      params[:domain_id]
  end

  def add_module_to_domain
    Domain.add_account_module(params[:domain_id], params[:module][:name])
    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
      params[:domain_id]
  end

  def set_property
    config = Configuration.find(params[:id])

    CoreServer::Base.connection.batch_request do
      if !params['new-property_name'].blank?
        # Wrap incoming value in [] to get around the fact the JSON parser
        # doesn't handle plain string tokens
        config.create_property(params['new-property_name'],
                             get_json_or_string(params['new-property_value']))

      else
        if !params[:delete_properties].nil?
          params[:delete_properties].each do |name, value|
            if value == 'delete'
              params[:properties].delete(name)
              config.delete_property(name)
            end
          end
        end

        params[:properties].each do |name, value|
          config.update_property(name, get_json_or_string(value))
        end
      end
    end

    CurrentDomain.flag_domain_id_out_of_date!(params[:domain_id])
    redirect_to '/internal/orgs/' + params[:org_id] + '/domains/' +
      params[:domain_id] + '/site_config/' + params[:id]
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
