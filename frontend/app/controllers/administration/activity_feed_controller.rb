class Administration::ActivityFeedController < AdministrationController
  include ActivityFeedHelper

  # Activity Feed
  #

  before_filter :only => [:index, :show] do |c|
    c.check_auth_level(UserRights::VIEW_ALL_DATASET_STATUS_LOGS)
  end

  def index
    return soql_index if FeatureFlags.derive(nil, request).enable_activity_log_soql

    page_size = 30
    all_threshold = 8
    page_idx = params.fetch(:page, 1).to_i
    offset = (page_idx - 1) * page_size

    activity_type = params[:activity_type]
    activity_type = activity_type == 'All' ? nil : activity_type

    activity_status = params[:activity_status] == 'All' ? nil : params[:activity_status]

    # parse start/end date from params
    date_string = params[:date_range]
    start_date = nil
    end_date = nil
    if date_string.present?
      begin
        dates = date_string.split(' - ')
        start_date = DateTime.strptime(dates[0] + ' 00:00:00', '%m/%d/%Y %H:%M:%S') # beginning of start day...
        if dates.count >= 2
          end_date = DateTime.strptime(dates[1] + ' 23:59:59', '%m/%d/%Y %H:%M:%S') # to end of end day
        else
          # if we have a start date but no end date, set the end date to the end of the start day
          end_date = DateTime.strptime(dates[0] + ' 23:59:59', '%m/%d/%Y %H:%M:%S')
        end
      rescue ArgumentError
        Rails.logger.warn("Invalid date in ActivityFeedController#index: #{date_string}")
      end
    end

    begin
      activities_response = ImportActivity.find_all_by_created_at_descending(
        :includeCount => false,
        :offset => offset,
        :limit => page_size + 1,
        :activityType => activity_type,
        :status => activity_status,
        :startDate => start_date,
        :endDate => end_date
      )
      @activities = activities_response[:activities]
      @activities.each { |activity| activity.initiated_by.profile_url = profile_path(activity.initiated_by) }

      @pager_info = {
        :next_page => page_idx + 1,
        :prev_page => [page_idx - 1, 1].max,
        :has_next_page? => @activities.size > page_size,
        :has_prev_page? => page_idx > 1,
        :params => {
          :activity_type => activity_type,
          :activity_status => activity_status,
          :date_range => date_string
        }.select { |_, v| v.present? }
      }
    rescue
      @activities = []
      @pager_info = {}
      @alert = { type: 'error', translation_key: 'server_error' }

      error_class = 'ImportActivityRequestFailure'
      error_message = 'Could not get activity list'
      report_error(error_class, error_message)
    end

    respond_to do |format|
      format.json {
        render :json => { activities: @activities, pager_info: @pager_info, error: @alert }
      }

      format.html {
        render 'index'
      }
    end
  end

  def show
    begin
      @activity = ImportActivity.find(params[:id])
    rescue ImportStatusService::ResourceNotFound
      return render_404
    rescue ImportStatusService::ServerError
      return render_500
    end
  end

  def soql_index

    render 'soql_index'
  end

  private

  def report_error(error_class, error_message)
    Airbrake.notify(
      :error_class => error_class,
      :error_message => error_message
    )
    Rails.logger.error(error_message)
  end
end
