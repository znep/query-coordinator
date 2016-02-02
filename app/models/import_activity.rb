# TODO: replace this REST API & wrapper with GraphQL
class ImportActivity

  # this should match the "activities.default-limit" option in
  # Import Status Service's config file
  FEED_ITEMS_LIMIT = 250

  # throws ISS errors and Core errors
  def self.find_all_by_created_at_descending
    response = ImportStatusService::get('/activity')
    activities = response.map(&:with_indifferent_access)
    view_ids = activities.pluck(:entity_id)
    views = View.find_multiple_dedup(view_ids)
    user_ids = activities.pluck(:user_id)
    users = User.find_multiple_dedup(user_ids)
    return activities.map do |activity|
      activity_wia = activity.with_indifferent_access
      ImportActivity.new(activity_wia, users[activity_wia[:user_id]], views[activity_wia[:entity_id]])
    end
  end

  # throws ISS errors and Core errors
  def self.find(id)
    activity = ImportStatusService::get("/activity/#{id}").with_indifferent_access

    ImportActivity.new(activity, User.find_profile(activity[:user_id]), View.find(activity[:entity_id]))
  end

  def ==(other)
    other.class == self.class && @data == other.data
  end

  def initialize(data, initiated_by, dataset)
    @data = data
    # TODO: these could actually happen if either one of them is deleted
    raise ArgumentError.new('initiated_by is blank') if initiated_by.blank?
    raise ArgumentError.new('dataset is blank') if dataset.blank?
    @dataset = dataset
    @initiated_by = initiated_by
  end

  def id
    @data[:id]
  end

  def activity_type
    @data[:activity_type]
  end

  def dataset
    @dataset
  end

  def initiated_by
    @initiated_by
  end

  def created_at
    Time.parse @data[:created_at]
  end

  def status
    @data[:status].downcase
  end

  def file_name
    @data[:activity_name]
  end

  # throws ISS errors
  def events
    @events ||= ImportStatusService::get("/activity/#{id}/events").map do |event|
      ImportActivityEvent.new(event.with_indifferent_access)
    end
  end

  protected

  attr_reader :data

end
