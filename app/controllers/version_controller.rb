class VersionController < ApplicationController
  skip_before_filter :require_logged_in_user

  # We use this endpoint as a health check and for monitoring.
  def show
    render json: {
      revision: Storyteller::REVISION_NUMBER,
      buildTimestamp: Storyteller::BUILD_TIMESTAMP,
      bootedTimestamp: Storyteller::BOOTED_TIMESTAMP,
      delayedJobAge30sCount: delayed_job_count(30)
    }
  end

  private

  def delayed_job_count(seconds)
    Delayed::Job.where('attempts = ? AND created_at < ?', 0, seconds.seconds.ago).size
  end

end
