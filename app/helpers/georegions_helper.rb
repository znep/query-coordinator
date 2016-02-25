module GeoregionsHelper
  def incomplete_curated_region_jobs
    curated_region_job_queue.get_queue(
      {:jobType => 'prepare_curated_region'},
      {:cookies => forwardable_session_cookies}
    )
  end

  def failed_curated_region_jobs
    failed_jobs_endpoint = '/activity?activityType=PrepareCuratedRegion&status=Failure'
    ImportStatusService::get(failed_jobs_endpoint)
  end

  def can_view_georegions_admin?(current_user)
    (current_user.is_admin? || current_user.roleName == 'administrator') &&
      feature_flag?(:enable_spatial_lens_admin, request)
  end

  def curated_region_job_queue
    @curated_region_job_queue ||= CuratedRegionJobQueue.new
  end
end
