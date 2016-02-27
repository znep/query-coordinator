module ViewModels
  module Administration
    class Georegions
      attr_reader :curated_regions
      attr_reader :curated_region_jobs
      attr_reader :failed_curated_region_jobs
      attr_reader :maximum_default_count
      attr_reader :site_title

      def initialize(curated_regions, curated_region_jobs, failed_curated_region_jobs, site_title)
        # NOTE: It is possible that two jobs for the same layer can exist simultaneously.
        # Although the possibility has a low likelihood (such as two users setting up
        # the same job simultaneously or some failure in the backend processing),
        # there should be some strategy for handling this situation gracefully.
        # For now, we can take one arbitrary job per layer since all we care about
        # is whether or not there is a job in progress for the layer; however,
        # if we decide to implement live status polling without page reload,
        # there may be a need to monitor multiple jobs per layer (perhaps in JS).

        # The set of available (enabled and disabled) curated regions (from Core)
        @curated_regions = curated_regions.uniq(&:id)
        # The set of queued/in-progress curated region jobs (from CRJQ)
        @curated_region_jobs = curated_region_jobs
        # The set of failed curated region jobs (from ISS)
        @failed_curated_region_jobs = failed_curated_region_jobs

        @maximum_default_count = 5 # Move to config?
        @site_title = site_title
      end

      def default_count
        curated_regions.count(&:default?)
      end

      def available_count
        curated_regions.count
      end

      def allow_defaulting?
        default_count < maximum_default_count
      end

      def translations
        LocalePart.screens.admin.georegions
      end

    end
  end
end
