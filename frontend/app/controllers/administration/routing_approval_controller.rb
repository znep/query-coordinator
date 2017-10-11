# Note (10/5/2017): the "new" Routing & Approval experience being created by the Discovery team is using
# a new controller, `approvals_controller.rb`

class Administration::RoutingApprovalController < AdministrationController

  #
  # Dataset Routing & Approval
  #
  before_filter :only => [:index, :queue, :approve_view, :manage, :manage_save] {|c| c.check_module('routing_approval')}
  before_filter :only => [:index, :queue] {|c| c.check_approval_rights}
  before_filter :only => [:manage, :manage_save] {|c| c.check_auth_level(UserRights::MANAGE_APPROVAL)}

  def index
    # We only support one template for now, so assume it is the first one
    @approval_template = Approval.find()[0]

    @appr_results = Clytemnestra.search_views(
      {:for_approver => true, :for_user => current_user.id, :limit => 1})
    @appr_count = @appr_results.count

    @stuck_results = Clytemnestra.search_views(
      {:limit => 5, :for_approver => true, :sortBy => 'approval'})
    @stuck_count = @stuck_results.count
    @stuck_results = @stuck_results.results.select {|v| v.is_stuck?(@approval_template)}
    @stuck_count = @stuck_results.length if @stuck_results.length < 5
  end

  def queue
    @params = params.reject {|k, v| k.to_s == 'controller' || k.to_s == 'action'}
    @limit = 10
    @opts = {:for_approver => true, :for_user => current_user.id, :limit => @limit,
      :page => (params[:page] || 1).to_i, :sortBy => params[:show_stuck] === 'true' ? 'approval' : 'newest'}
    @base_url = request.path

    @opts[:q] = params[:q] if !params[:q].blank?
    @opts[:approval_stage_id] = params[:stage_id] if !params[:stage_id].blank?

    # Whether or not we need to display icons for other domains
    @use_federations = Federation.find.select {|f| f.acceptedUserId.present? &&
        f.sourceDomainCName != CurrentDomain.cname }.length > 0

    @view_results = Clytemnestra.search_views(@opts)

    @view_count = @view_results.count
    @view_results = @view_results.results

    # Fetch all the approval history in a batch
    (CoreServer::Base.connection.batch_request do |batch_id|
      @view_results.each do |v|
        v.approval_history_batch(batch_id)
      end
    end || []).each_with_index do |r, i|
      @view_results[i].set_approval_history(JSON.parse(r['response']))
    end

    # We only support one template for now, so assume it is the first one
    @approval_template = Approval.find()[0]
  end

  def approve_view
    if current_user.nil?
      render_forbidden
      return false
    end

    # Construct a fake view, since it might be cross-domain and we can't
    # load views cross-domain
    v = View.parse({'id' => params[:id]}.to_json)

    # We only support one template for now, so assume it is the first one
    approval_template = Approval.find()[0]

    # Rely on core server to throw an error if no perms
    begin
      v.set_approval(approval_template, params[:approval_type], params[:comment])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = t('screens.admin.routing_approval.dataset_not_found')
      render 'shared/error', :status => :not_found
      return nil
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required'
        require_user(true)
        return nil
      elsif e.error_code == 'permission_denied'
        render_forbidden(e.error_message)
        return nil
      else
        flash.now[:error] = e.error_message
        render 'shared/error', :status => :internal_server_error
        return nil
      end
    end

    flash[:notice] = case params[:approval_type]
           when 'A'
             t('screens.admin.routing_approval.approval_types.approved')
           when 'R'
             t('screens.admin.routing_approval.approval_types.rejected')
           when 'M'
             t('screens.admin.routing_approval.approval_types.resubmitted')
           end

    return(redirect_to (request.referer || {:action => 'queue'}))
  end

  def manage
    # We only support one template for now, so assume it is the first one
    @approval_template = Approval.find()[0]

    @users = {}
    unless @approval_template.nil?
      (CoreServer::Base.connection.batch_request do |batch_id|
        (@approval_template.stages || []).each do |s|
          (s['approverUids'] || []).each do |userId|
            User.find(userId, {}, batch_id)
          end
        end
      end || []).each do |r|
        u = User.parse(r['response'])
        @users[u.id] = u
      end
    end
  end

  def manage_save
    if params[:template][:name].empty?
      flash[:error] = t('screens.admin.routing_approval.fill_required_fields')
      return(redirect_to :action => 'manage')
    end

    app = Approval.find()[0]
    max_ii = params[:template][:maxInactivityInterval].to_i
    max_ii = 5 if (max_ii < 1)

    approve_only_new = params[:template][:approveOnlyNew] == true ||
      params[:template][:approveOnlyNew] =~ (/^(true|t|yes|y|1)$/i)
    attrs = {
      :name => params[:template][:name],
      :requireApproval => true,
      :reapproveOnPublish => !approve_only_new,
      :maxInactivityInterval => max_ii,
      :stages => []
    }

    unless app.nil?
      app.stages.each do |s|
        sp = params[:template][:stages][s['id'].to_s]
        next if sp.nil? || sp[:name].nil? || sp[:name].blank?
        sp[:approverUids].map! { |u| (u.match(/\w{4}-\w{4}$/) || [])[0] }.compact!
        sp[:approverUids].each_with_index { |u, index|
          if s["approverSilence"][index].nil?
            s["approverSilence"][index] = false
          end
        }

        if sp[:approverUids].length < s["approverSilence"].length
          s["approverSilence"] = s["approverSilence"].slice(0, sp[:approverUids].length)
        end

        attrs[:stages] << s.merge(sp)
      end

    end

    params[:template][:stages].sort.each do |s|
      if s[0].start_with?('new-') && !s[1][:name].blank?
        ns = s[1]
        attrs[:stages] << {'name' => ns[:name],
          'notificationInterval' => ns[:notificationInterval],
          'approverUids' => ns[:approverUids].
            map {|u| (u.match(/\w{4}-\w{4}$/) || [])[0]}.compact,
          'stageOrder' => (attrs[:stages].last ||
                           {'stageOrder' => 0})['stageOrder'] + 1,
          'notificationMode' => ns[:notificationMode]}
      end
    end

    # The core server supports datasets being visible at any stage in the process, but that seems like
    # it would be confusing. So we just always make the last stage visible, and the rest not
    if attrs[:stages].length > 0
      attrs[:stages].each {|s| s['visible'] = false}.last['visible'] = true
    else
      flash[:error] = t('screens.admin.routing_approval.one_stage_required')
      return(redirect_to :action => 'manage')
    end

    if attrs[:stages].any? {|s| s['approverUids'].empty?}
      flash[:error] = t('screens.admin.routing_approval.stage_requires_approver')
      return(redirect_to :action => 'manage')
    end

    if app.nil?
      is_grandfather = params[:grandfatherDatasets] === 'true'
      orig_enabled = attrs[:requireApproval]

      # Initially save the approval as disabled so that when we grandfather datasets, notification
      # emails aren't sent for everything. Once grandfathering is done, we update it back to enabled
      attrs[:requireApproval] = false if is_grandfather
      app = Approval.create(attrs)

      if is_grandfather
        app.grandfather()
        app.update_attributes!({:requireApproval => true}) if orig_enabled
      end
    else
      app.update_attributes!(attrs)
    end

    flash[:notice] = t('screens.admin.routing_approval.data_saved')

    return(redirect_to (request.referer || {:action => 'manage'}))
  end
end

