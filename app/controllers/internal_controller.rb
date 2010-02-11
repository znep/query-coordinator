class InternalController < ApplicationController
  before_filter :check_auth

  def index
  end

  def index_orgs
    @orgs = Organization.find()
  end

  def show_org
    @org = Organization.find(params[:id])
    @tiers = Accounttier.find()
  end

  def show_domain
    @domain = Domain.find(params[:id])
    @modules = Accountmodule.find().sort {|a,b| a.name <=> b.name}
  end

  def show_config
    @domain = Domain.find(params[:domain_id])
    @config = Configuration.find(params[:id])
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

      Configuration.create({'name' => 'Current theme',
        'default' => true, 'type' => 'site_theme', 'parentId' => parentConfigId,
        'domainCName' => domain.cname})
      Configuration.create({'name' => 'Feature set',
        'default' => true, 'type' => 'feature_set', 'domainCName' => domain.cname})

    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return (render 'shared/error', :status => :internal_server_error)
    end
    redirect_to '/internal/orgs/' + params[:id] + '/domains/' + domain.cname
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

end
