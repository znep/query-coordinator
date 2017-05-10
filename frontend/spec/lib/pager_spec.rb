describe Pager do

  page_size = 5

  it 'returns all pages with no ellipses if <= 8 pages' do
    num_pages = 8
    total_items = page_size * num_pages
    expect(Pager::paginate(total_items, page_size, 8, {}).
        map {|element| element.index}).to eq((1..num_pages).to_a)
  end

  it 'returns `first 8 ...` if >= 8 pages and index <= 6' do
    num_pages = 10
    total_items = page_size * num_pages
    expect(Pager::paginate(total_items, page_size, 6, {})).to eq([
      Pager::PageElement.new(1, false),
      Pager::PageElement.new(2, false),
      Pager::PageElement.new(3, false),
      Pager::PageElement.new(4, false),
      Pager::PageElement.new(5, false),
      Pager::PageElement.new(6, true),
      Pager::PageElement.new(7, false),
      Pager::PageElement.new(8, false),
      Pager::ELLIPSIS
    ])
  end

  it 'marks the given `current_page` as selected' do
    num_pages = 6
    total_items = page_size * num_pages
    expect(Pager::paginate(total_items, page_size, 2, {}).
        map {|element| element.selected?}).to eq([false, true, false, false, false, false])
  end

  it 'returns `first two ... middle five ...` if current page is 7 or later, but there are more at the end' do
    num_pages = 10
    total_items = page_size * num_pages
    expect(Pager::paginate(total_items, page_size, 7, {})).to eq([
      Pager::PageElement.new(1, false),
      Pager::PageElement.new(2, false),
      Pager::ELLIPSIS,
      Pager::PageElement.new(5, false),
      Pager::PageElement.new(6, false),
      Pager::PageElement.new(7, true),
      Pager::PageElement.new(8, false),
      Pager::PageElement.new(9, false),
      Pager::ELLIPSIS
    ])
  end

  it 'returns `first two ... last few` there are more than 8 pages and there are no more at the end' do
    num_pages = 10
    total_items = page_size * num_pages
    expect(Pager::paginate(total_items, page_size, 9, {})).to eq([
      Pager::PageElement.new(1, false),
      Pager::PageElement.new(2, false),
      Pager::ELLIPSIS,
      Pager::PageElement.new(7, false),
      Pager::PageElement.new(8, false),
      Pager::PageElement.new(9, true),
      Pager::PageElement.new(10, false)
    ])
  end

end