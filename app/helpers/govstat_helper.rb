module GovstatHelper

  def progress_indicator(metric_prefix = '')
    metric_prefix += '.' if !metric_prefix.blank?
    { type: 'Text', customClass: 'goalProgress',
      htmlClass: 'progress-{' + metric_prefix + 'compute.progress}',
      ifValue: metric_prefix + 'compute.delta',
        html:
          '<div class="good">On Track<span class="ss-icon">directup</span></div>' +
          '<div class="flat">In Progress<span class="ss-icon">directright</span></div>' +
          '<div class="poor">Needs Improvement<span class="ss-icon">directdown</span></div>'
    }
  end

end
