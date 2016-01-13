class StoryAccessLogger

  def self.log_story_view_access(story)
    current_domain_id = CoreServer.current_domain['id']
    metrics = []
    metrics << Metric.new(story.uid, 'view-loaded')
    metrics << Metric.new(current_domain_id, 'view-loaded')
    metrics << Metric.new(current_domain_id, 'published-story-loaded') if story.is_a?(PublishedStory)
    metrics << Metric.new("views-loaded-#{current_domain_id}", "view-#{story.uid}")

    ProcessMetricsJob.perform_later(metrics.map(&:to_hash))
  end

end
