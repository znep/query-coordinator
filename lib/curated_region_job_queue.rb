class CuratedRegionJobQueue < SocrataHttp

  class CuratedRegionJobQueue::ServerError < StandardError; end

  def enqueue_job(attributes, id, options = {})
    response = issue_request(
      :verb => :post,
      :data => attributes,
      :headers => {
        'Content-Type' => 'application/json'
      },
      :request_id => options[:request_id],
      :cookies => options[:cookies],
      :path => "v1/dataset/#{id}/enqueue"
    )
    response[:body]
  end

  def on_failure(response, url, verb)
    Rails.logger.error("#{verb.upcase} at #{url} failed with response: #{response}")
    raise CuratedRegionJobQueue::ServerError.new(response.inspect)
  end

  def connection_details
    {
      :address => ENV['CURATED_REGION_JOB_QUEUE_HOSTNAME'] || APP_CONFIG.curated_region_job_queue_hostname,
      :port => ENV['CURATED_REGION_JOB_QUEUE_PORT'] || APP_CONFIG.curated_region_job_queue_port
    }.with_indifferent_access
  end
end
