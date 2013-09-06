class AnalyticsController < ApplicationController
  skip_before_filter :require_user
  skip_before_filter :verify_authenticity_token, :only => [:add, :add_all]

  def index
    if !CurrentDomain.feature? :public_site_metrics
      return render_404
    end
  end

  def add_all
    data = ActiveSupport::JSON.decode(request.body)
    metrics = data["metrics"]
    metrics.each { |m|
      valid, error = add_metric(m['entity'], m['metric'], m['increment'])
      return render_metric_error(error) unless valid
    }
    render :json => "OK".to_json
  end

  def add
    valid, error = add_metric(params[:domain_entity], params[:metric], params[:increment])
    return render_metric_error(error) unless valid
    render :json => "OK".to_json
  end


  private

  def add_metric(entity, metric, raw_increment)

  # metrics and entities must be simple names, optional hyphens
    if (metric =~ /^[a-z-]+$/ ).nil? || (entity =~ /^[a-z-]+$/ ).nil?
      return [false, "Entity/Metric not properly formed"]
    end

    unless ClientAnalyticsHelper.is_allowed(entity, metric)
      return [false, "Entity/Metric not allowed: #{entity}/#{metric}"]
    end

    # increment must be a positive integer
    increment = ClientAnalyticsHelper.get_valid_increment(entity, metric, raw_increment)
    if increment < 0
      return [false, "Metric Value Invalid"]
    end

    # Currently we replace 'domain' with the domain id, but presumably
    # it will be desirable someday to have domain-centric entities outside
    # the main one, such as we have with "referers-[domainId]" - We should
    # do a search and replace at that point then.
    if entity == 'domain'
      entity = CurrentDomain.domain.id.to_s
    end

    if entity == 'domain-intern'
      entity = CurrentDomain.domain.id.to_s + "-intern"
    end

    Rails.logger.info("Pushing client-side metric, #{entity}/#{metric} = #{increment}")
    MetricQueue.instance.push_metric(entity, metric, increment)

    [true, nil]
  end

  def render_metric_error(reason)
    render :json => reason.to_json, :status => 400
  end
end



module ClientAnalyticsHelper
  FUNCTIONAL_BUCKETS =  %w(homepage dataset dataslate admin profile other).freeze

  # deprecated
  PERFORMANCE_BUCKETS=  %w(awesome good ok poor terrible).freeze
  DYNAMIC_METRIC_TYPES =  %w(js-dom-load-samples js-page-load-samples js-page-load-time js-dom-load-time).freeze

  DYNAMIC_MARK_METRIC_TYPES  =  %w(js-dom-load-samples js-page-load-samples).freeze

  STATIC_MARK_METRICS = %w(domain/js-page-view
                           domain-intern/js-page-load-samples
                           domain-intern/js-dom-load-samples).freeze


  STATIC_ALLOWED_METRICS = %w(domain/js-page-view
                              domain-intern/js-page-load-samples
                              domain-intern/js-page-load-time
                              domain-intern/js-response-start-time
                              domain-intern/js-response-read-time
                              domain-intern/js-dom-load-time
                              domain-intern/js-map-one-page-load-time
                              domain-intern/js-map-many-page-load-time
                              domain-intern/js-spinner-main-time
                              domain-intern/js-spinner-save-time
                              domain-intern/js-spinner-upload-time
                              domain-intern/js-spinner-thumbnail-time
                              domain-intern/js-spinner-nomination-time
                              domain-intern/js-spinner-routing-time
                              domain-intern/js-spinner-dataslate-configurator-time
                              domain-intern/js-spinner-dataslate-global-time
                              domain-intern/js-spinner-dataslate-component-time).freeze



  def self.generateMarkMetrics
    generatePermutations STATIC_MARK_METRICS, DYNAMIC_MARK_METRIC_TYPES
  end

  def self.generateMetrics
    generatePermutations STATIC_ALLOWED_METRICS, DYNAMIC_METRIC_TYPES
  end

  def self.generatePermutations(static_metrics, base_metrics)

    ret_val = Array.new(static_metrics)
    FUNCTIONAL_BUCKETS.each do |functional_bucket|
      base_metrics.each do |dynamic_metric|
        # Performance buckets are deprecated; and can be removed after a few days (there still may)
        # be some browsers sending us these metrics.
        PERFORMANCE_BUCKETS.each do |perf_bucket|
          ret_val.push "domain-intern/#{functional_bucket}-#{perf_bucket}-#{dynamic_metric}"
        end
        ret_val.push "domain-intern/#{functional_bucket}-#{dynamic_metric}"
      end
    end

    ret_val.freeze
  end


  MARK_METRICS = self.generateMarkMetrics
  ALLOWED_METRICS = self.generateMetrics


  def self.get_valid_increment(entity, metric, input)
    increment = input.to_i
    # ten minute upper bound; to exclude things like 
    # a user shutting thier laptop during a page load
    if increment < 0 || increment > 600000 
      return -1
    end
    if is_mark(entity, metric)
      increment = 1
    end
    increment
  end

  def self.is_mark(entity, metric)
    allowed = MARK_METRICS.include?(entity + '/' + metric)
    allowed
  end

  def self.is_allowed(entity, metric)
    allowed = ALLOWED_METRICS.include?(entity + '/' + metric)
    allowed
  end

end
