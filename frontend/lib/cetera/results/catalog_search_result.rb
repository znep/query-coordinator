module Cetera
  module Results
    # Search results from the catalog
    class CatalogSearchResult < SearchResult
      @klass = Cetera::Results::ResultRow
    end
  end
end
