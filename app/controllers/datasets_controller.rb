class DatasetsController < ApplicationController
  include DatasetsHelper
  skip_before_filter :require_user, :only => [:show, :alt, :widget_preview, :math_validate]

# collection actions
  def new
    if (!CurrentDomain.user_can?(current_user, :create_datasets) &&
        !CurrentDomain.module_enabled?(:community_creation))
      # User doesn't have access to create new datasets
      render 'shared/error', :status => :not_found
      return nil
    end
  end

# member actions
  def show
    # adjust layout to thin versions (rather than '_full')
    @page_custom_header = 'header'
    @page_custom_footer = 'footer'

    if is_mobile? && (params[:no_mobile] != 'true')
      redirect_to :controller => 'widgets', :action => 'show', :id => params[:id]
    end

    @view = get_view(params[:id])
    return if @view.nil?

    if !params[:row_id].nil?
      @row = @view.get_row(params[:row_id])
      if @row.nil?
        flash.now[:error] = 'This row cannot be found, or has been deleted.'
        render 'shared/error', :status => :not_found
        return nil
      end
    end

    if !current_user
      @user_session = UserSession.new
    end

    href = @view.href
    href += '/' + params[:row_id] if !params[:row_id].nil?
    # See if it matches the authoritative URL; if not, redirect (but only if we
    # aren't cheating and showing them the new datasets page)
    if request.path != href && CurrentDomain.module_available?('new_datasets_page')
      # Log redirects in development
      if Rails.env.production? && request.path =~ /^\/dataset\/\w{4}-\w{4}/
        logger.info("Doing a dataset redirect from #{request.referrer}")
      end
      redirect_to(href + '?' + request.query_string)
    end

    # If we're displaying a single dataset, set the meta tags as appropriate.
    @meta[:title] = @meta['og:title'] = "#{@view.name} | #{CurrentDomain.strings.site_title}"
    @meta[:description] = @meta['og:description'] = @view.meta_description
    @meta['og:url'] = @view.href
    # TODO: when we support a dataset image, allow that here if of appropriate size

    # Shuffle the default tags into the keywords list
    @meta[:keywords] = @view.meta_keywords
  end

# bare version of the page, w/o chrome, for screenshotting
  def bare
    @view = get_view(params[:id])
    return if @view.nil?
    # if the core server requests a specific timeout, rather than
    # letting the js decide when it's rendered
    if params[:timeout].present?
      if params[:timeout].to_i < 60
        @snapshot_timeout = params[:timeout]
      else
        Rails.logger.info("Ignoring snapshot request, over 60 second limit (#{params[:timeout]})")
      end
    end

    @snapshot_name = params[:name]

    if !current_user
      @user_session = UserSession.new
    end

    render :layout => false
  end

  def alt
    @view = get_view(params[:id])
    return if @view.nil?

    if !current_user && params[:force_login]
      return require_user(true)
    end

    @conditions = parse_alt_conditions(params)

    # build state for the sake of the pager
    @state_param = {}
    [:filter, :sort, :search_string].each{ |key| @state_param[key] = params[key] unless params[key].nil? }
    @state_param = @state_param.to_param

    if @view.is_tabular?
      # get rows
      @per_page = 50
      @data, @viewable_columns, @aggregates, @row_count = @view.find_data(@per_page, @page, @conditions)
    end

    @view.register_opening(request.referrer)
    @view_activities = Activity.find({:viewId => @view.id})
  end

  def math_validate
    @view = get_view(params[:id])
    return if @view.nil?
    equation_parts = ActiveSupport::Base64.decode64(params['equation_token']).strip.split(/\s+/)
    str_to_num = {
      'zero'  => 0,
      'one'   => 1,
      'two'   => 2,
      'three' => 3,
      'four'  => 4,
      'five'  => 5,
      'six'   => 6,
      'seven' => 7,
      'eight' => 8,
      'nine'  => 9,
      'ten'   => 10
    }
    num1 = str_to_num[equation_parts[0]]
    num2 = str_to_num[equation_parts[2]]
    operator = equation_parts[1]

    if(operator == 'plus')
      answer = num1 + num2
    elsif(operator == 'minus')
      answer = num1 - num2
    end

    if answer==str_to_num[params['user_answer'].strip.downcase]
      flag_params = {}
      keys = [:id, :type, :subject, :message, :from_address]
      keys.each { |key| flag_params[key] = params[key] }

      @view.flag(flag_params)
      render :json => { :success => true }
    else
      render :json => { :success => false }
    end
  end

  def widget_preview
    @view = get_view(params[:id])
    return if @view.nil?

    @customization_id = params[:customization_id]
    @customization_id = CurrentDomain.default_widget_customization_id if @customization_id.blank?

    render :layout => 'plain'
  end

  def edit_metadata
    if params[:view].nil?
      @view = get_view(params[:id])
      return if @view.nil?
    else
      if params[:view][:metadata] && params[:view][:metadata][:attachments]
        params[:view][:metadata][:attachments].delete_if { |a| a[:delete].present? }
      end
      begin
        # This sucks, but is necessary for the accessible version
        if params[:attachment_new]
          if (params[:view][:metadata].nil? || params[:view][:metadata][:attachments].nil?)
            params[:view].deep_merge!({ :metadata => { :attachments => []} } )
          end

          attachment = JSON.parse(
            CoreServer::Base.connection.multipart_post_file('/assets',
              params[:attachment_new]))

          params[:view][:metadata][:attachments] << {:blobId => attachment['id'],
            :filename => attachment['nameForOutput'],
            :name => attachment['nameForOutput']}
        end
        @view = View.update_attributes!(params[:id], params[:view])
        flash.now[:notice] = "The metadata has been updated."
      rescue CoreServer::CoreServerError => e
        return respond_to do |format|
          flash.now[:error] = "An error occurred during your request: #{e.error_message}"
        end
      end
    end
  end

  def thumbnail
    @view = get_view(params[:id])
    return if @view.nil?

    unless @view.has_rights?('update_view')
      return render_forbidden
    end

  end

  def stats
    @view = get_view(params[:id])
    if !(@view.user_granted?(current_user) || \
        CurrentDomain.user_can?(current_user, :edit_others_datasets))
      return render_forbidden
    end
  end

protected
  def get_view(id)
    begin
      view = View.find(id)
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
            ' or view cannot be found, or has been deleted.'
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

    if (view.is_form? ? !view.can_add? : !view.can_read?)
      render_forbidden("You do not have permission to view this dataset")
      return nil
    end

    return view
  end

  def parse_alt_conditions(params)
    # parse params
    @conditions = {}
    #   page params
    @page = (params[:page] || 1).to_i
    #   filter params
    unless params[:filter].nil?
      filters = []
      params[:filter].each do |column_id, filter|
        next if filter[:operator].blank?
        filter_condition = {
          'type' => 'operator',
          'value' => filter[:operator],
          'children' => [ {
            'type' => 'column',
            'columnId' => column_id
          } ]
        }
        filter_condition['children'].push({
            'type' => 'literal',
            'value' => filter[:value]
        }) if !filter[:value].nil?
        filters.push(filter_condition)
      end
      unless filters.empty?
        @conditions['filterCondition'] = {
          'type' => 'operator',
          'value' => 'AND',
          'children' => filters
        }
      end
    end
    #   sort params
    unless params[:sort].nil?
      sorts = []
      params[:sort].each do |idx, sort|
        next if sort[:field].blank?
        sorts.push({
          'ascending' => (sort[:direction].downcase == 'ascending'),
          'expression' => {
            'type' => 'column',
            'columnId' => sort[:field]
          }
        })
      end
      @conditions['orderBys'] = sorts unless sorts.empty?
    end
    # search params
    @conditions['searchString'] = params[:search_string] unless params[:search_string].blank?

    return @conditions
  end
end
