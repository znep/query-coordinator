module FrontendRefinements
  module Attemptable
    refine Object do
      def attempt(*args, &block)
        try(*args, &block) || self
      end
    end
  end
end
