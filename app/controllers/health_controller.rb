class HealthController < ApplicationController
  def show
    render json: {
      bootedTimestamp: Storyteller::BOOTED_TIMESTAMP,
      delayedJobQueues: delayed_job_queue_status
    }
  end

  private

  def delayed_job_queue_status
    queue_status = {}

    queue_status.merge!(get_queue_status(:documents, 30))
    queue_status.merge!(get_queue_status(:domains, 300))
    queue_status.merge!(get_queue_status(:metrics, 60))
    queue_status.merge!(get_queue_status(:thumbnails, 60))

    queue_status
  end

  def get_queue_status(queue, max_age)
    delayed_job_count = Delayed::Job.where('queue = ? AND attempts = ? AND created_at < ?',
      queue,
      0,
      max_age.seconds.ago
    ).size

    {
      queue.to_sym => {
        :maxAge => max_age,
        :count => delayed_job_count
      }
    }
  end
end
