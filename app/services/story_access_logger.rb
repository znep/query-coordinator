class StoryAccessLogger

  def self.log_story_view_access(story)
    metrics = []

    # We're only currently interested in logging view-loaded metrics for published stories
    # as that metric is used to calculate the popularity of the story.
    if story.is_a?(PublishedStory)
      current_domain_id = CoreServer.current_domain['id']
      metrics << Metric.new(story.uid, 'view-loaded')
      metrics << Metric.new(current_domain_id, 'view-loaded')
      metrics << Metric.new(current_domain_id, 'published-story-loaded')
      metrics << Metric.new("views-loaded-#{current_domain_id}", "view-#{story.uid}")
    end

    ProcessMetricsJob.perform_later(metrics.map(&:to_hash)) unless metrics.empty?
  end

end
