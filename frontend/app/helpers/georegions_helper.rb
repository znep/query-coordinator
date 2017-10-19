module GeoregionsHelper
  def incomplete_curated_region_jobs
    begin
      curated_region_job_queue.get_queue(
        {:jobType => 'prepare_curated_region'},
        {:cookies => forwardable_session_cookies}
      )
    rescue StandardError => ex
      Rails.logger.warn("Encountered error while trying to access CRJ: #{ex}")
      nil
    end
  end

  def failed_curated_region_jobs
    begin
      failed_jobs_endpoint = '/activity?activityType=PrepareCuratedRegion&status=Failure'
      ImportStatusService::get(failed_jobs_endpoint)
    rescue StandardError => ex
      Rails.logger.warn("Encountered error while trying to access ISS: #{ex}")
      nil
    end
  end

  def can_view_georegions_admin?
    (current_user || User.new).has_right?(UserRights::MANAGE_SPATIAL_LENS)
  end

  def curated_region_job_queue
    @curated_region_job_queue ||= CuratedRegionJobQueue.new
  end
end
