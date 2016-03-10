# TODO: replace this REST API & wrapper with GraphQL
class ImportActivity

  # throws ISS errors and Core errors
  def self.find_all_by_created_at_descending(offset, limit)
    url = "/v2/activity?limit=#{limit}&offset=#{offset}"
    response = ImportStatusService::get(url)
    activities = response['activities'].map(&:with_indifferent_access)
    view_ids = activities.pluck(:entity_id)
    working_copy_ids = activities.pluck(:working_copy_id)
    views = View.find_multiple_dedup(view_ids + working_copy_ids)
    user_ids = activities.pluck(:user_id)
    users = User.find_multiple_dedup(user_ids)
    {
      :activities =>
          activities.map do |activity|
            activity_wia = activity.with_indifferent_access
            ImportActivity.new(activity_wia,
                               users[activity_wia[:user_id]],
                               views[activity_wia[:entity_id]],
                               views[activity_wia[:working_copy_id]])
          end,
      :count => response['count']
    }
  end

  # throws ISS errors and Core errors
  def self.find(id)
    activity = ImportStatusService::get("/activity/#{id}").with_indifferent_access

    begin
      view = View.find(activity[:entity_id])
    rescue CoreServer::ResourceNotFound
      view = nil
    end

    begin
      user = User.find_profile(activity[:user_id])
    rescue CoreServer::ResourceNotFound
      user = nil
    end

    begin
      working_copy = activity[:working_copy_id].present? ? View.find(activity[:working_copy_id]) : nil
    rescue CoreServer::ResourceNotFound
      working_copy = nil
    end

    ImportActivity.new(activity, user, view, working_copy)
  end

  def ==(other)
    other.class == self.class && @data == other.data
  end

  # nil for initiated_by, dataset or working_copy means that that user or dataset has been deleted
  # nil for working_copy may also mean there is no associated working_copy
  def initialize(data, initiated_by, dataset, working_copy)
    @data = data
    @dataset = dataset
    @initiated_by = initiated_by
    @working_copy = working_copy
  end

  def id
    @data[:id]
  end

  def activity_type
    @data[:activity_type].downcase
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

  def import_method
    case @data[:service]
      when 'Imports2'
        'Web interface'
      when 'DeltaImporter2'
        'DataSync'
      when 'Upsert'
        'Upsert API'
      else
        @data[:service]
    end
  end

  # throws ISS errors
  def events
    @events ||= ImportStatusService::get("/activity/#{id}/events").map do |event|
      ImportActivityEvent.new(event.with_indifferent_access)
    end
  end

  def last_updated
    if events.blank?
      created_at
    else
      events.sort_by(&:event_time).last.event_time
    end
  end

# even if true @working_copy may still be nil, if the activity was performed on a wc that was since deleted
  def had_working_copy?
    @data[:working_copy_id].present?
  end

  def working_copy_id
    @data[:working_copy_id]
  end

  def working_copy
    @working_copy
  end

  def working_copy_display
    if @working_copy.blank?
      "#{working_copy_id} (deleted)"
    elsif @working_copy.is_snapshotted?
      "#{working_copy_id} (published)"
    else
      working_copy_id
    end
  end

  protected

  attr_reader :data

end
