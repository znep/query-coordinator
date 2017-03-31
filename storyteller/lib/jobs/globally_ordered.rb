# By way of background: it was apparently easier for us operationally to launch
# all processes (everything under the runit dir) on every worker node, because
# this means we don't have to bother with setting up separate apps or containers
# or anything. This setup does complicate matters, however, when you actually
# _don't_ want multiple consumers from a queue.
#
# With "allow fine-grained scaling control over individual processes" off the
# table, the options are
#
#   A) use shared database state to enforce order ("mutex" approach), or
#   B) unschedule/skip jobs that have been made obsolete ("verify" approach)
#
# and at present, it seems like the mutex approach is much simpler to implement.
# The verify approach requires deep introspection of _all_ jobs to determine
# (according to job-specified logic) whether any single job should do anything
# once claimed; the mutex approach, on the other hand, only requires such jobs
# to pretend that they execute in a non-distributed context. Naturally, the
# throughput of the mutex approach is slower because we don't know exactly when
# the current job completes... but that's the trade-off we're accepting.
#
# The below implementation for the mutex approach relies on the fact that the
# delayed_jobs table is queried with an implicit order on the primary key
# (although we compare by the job's GUID because the job instance doesn't have
# a reference to the database PK).
module GloballyOrdered
  def enforce_execution_order(queue, &block)
    next_locked_job_record = Delayed::Job.where(
      'locked_at IS NOT NULL AND failed_at IS NULL AND queue = :queue',
      queue: queue
    ).limit(1).first
    next_locked_job = YAML.load(next_locked_job_record.handler)

    if next_locked_job.job_data['job_id'] == self.job_id
      # This job itself is the oldest locked (claimed) job.
      # It should be processed now.
      yield
    else
      # Another job is currently being processed.
      # Sleep for 15-30 seconds and check again.
      Rails.logger.warn(
        "Sleeping execution of GloballyOrdered job #{self.job_id}..."
      )
      sleep (15 + rand(15))
      enforce_execution_order(queue, &block)
    end
  end
end
