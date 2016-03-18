module Pager

  def self.paginate(num_items, page_size, current_page, options)
    options ||= {}
    middle_padding = options.fetch(:middle_padding, 2)
    edge = options.fetch(:edge, 2)
    all_threshold = options.fetch(:all_threshold, 8)

    total_num_pages = (num_items.to_f / page_size).ceil

    if total_num_pages <= all_threshold
      # e.g. [1,*2*,3,4]
      (1..total_num_pages).map do |idx|
        PageElement.new(idx, idx == current_page)
      end
    elsif current_page - middle_padding <= edge + 2
      # e.g. [1,*2*,3,...]
      (1..all_threshold).map do |idx|
        PageElement.new(idx, current_page == idx)
      end + [ELLIPSIS]
    elsif current_page + middle_padding >= total_num_pages
      # e.g. [1,2,...,7,*8*,9]
      FRONT_EDGE + (current_page - middle_padding..total_num_pages).map do |idx|
        PageElement.new(idx, current_page == idx)
      end
    else
      # e.g. [1,2,...,7,*8*,9,...]
      middle_elements = (current_page - middle_padding..current_page + middle_padding).map do |idx|
        PageElement.new(idx, current_page == idx)
      end
      FRONT_EDGE + middle_elements + [ELLIPSIS]
    end
  end

  class PagerElement; end

  class PageElement < PagerElement

    def initialize(index, selected)
      @index = index
      @selected = selected
    end

    def ==(other)
      other.class == self.class && index == other.index && other.selected? == selected?
    end

    def page?
      true
    end

    attr_accessor :index, :selected
    alias :selected? :selected

  end

  class EllipsisElement < PagerElement

    def page?
      false
    end

  end

  ELLIPSIS = EllipsisElement.new

  FRONT_EDGE = [PageElement.new(1, false), PageElement.new(2, false), ELLIPSIS]

end