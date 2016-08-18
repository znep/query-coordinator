class Administration::ActivityFeedController < AdministrationController
  include ActivityFeedHelper

  # Activity Feed
  #

  before_filter :only => [:index, :show] do |c|
    c.check_feature_flag(:show_admin_processes) && c.check_auth_level(UserRights::VIEW_ALL_DATASET_STATUS_LOGS)
  end

  def index
    page_size = 30
    all_threshold = 8
    page_idx = params.fetch(:page, 1).to_i
    offset = (page_idx - 1) * page_size

    activity_type = params[:activity_type]
    activity_type = activity_type == 'All' ? nil : activity_type

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

    activities_response = ImportActivity.find_all_by_created_at_descending(
      :offset => offset,
      :limit => page_size,
      :activityType => activity_type,
      :startDate => start_date,
      :endDate => end_date
    )
    @activities = activities_response[:activities]
    count = activities_response[:count]

    # preserve URL parameters across pages
    pager_params = {}
    if activity_type.present?
      pager_params[:activity_type] = activity_type
    end

    if date_string.present?
      pager_params[:date_range] = date_string
    end

    @pager_elements = Pager::paginate(count, page_size, page_idx, :all_threshold => all_threshold, :params => pager_params)
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
end
