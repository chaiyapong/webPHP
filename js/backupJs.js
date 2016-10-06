(function ($, window, document, undefined) {
	var DataTable, page, totalRowOfPage, totalRow, totalPage, startPage, endPage, $tables, $pagination;
	page = 0;

    $tables = $("#dataTables-example");
    $pagination = $('#pagination-demo');

	totalRowOfPage = $("#maxRow").val();
	totalRow = $tables.find('tbody tr').length;
	totalPage = Math.ceil(totalRow/totalRowOfPage);


	$("#maxRow").change(function() {
    	totalRowOfPage = $(this).val();
    	totalPage = Math.ceil(totalRow/totalRowOfPage);
    	startPage = (page-1) * totalRowOfPage;
    	endPage = page * totalRowOfPage;

    	$.dataTable.prototype.setPaging($pagination);
    	$tables.find('tbody tr').hide().slice(startPage, endPage).show();
	});

	$.dataTable = function ($table, settings) {
		var self = this;

		this.$table = $table;
		this.$thead = this.$table.find('thead');

		this.settings = $.extend({}, DataTable.defaults.sort , settings);
		this.$sortCells = this.$thead.length > 0 ? this.$thead.find('th:not(.no-sort)') : this.$table.find('th:not(.no-sort)');
		
		self.sort(this.$thead.find("tr th:nth-child(1)"), "sSortDesc");

		this.$sortCells.bind('click', function() {
			self.sort($(this));
		});

		this.index = 0;
		this.$th = null;
		this.direction = "sSortDesc";
	};

	$.dataTable.prototype = {
		findSortKey: function(columeValue, th){	
			if(th.is("#sort-numeric")){
				var key = columeValue.replace(/^[^\d.]*/, '');
				key = parseFloat(key);
				return isNaN(key) ? 0 : key;
			} else if(th.is("#sort-date")) {
				return Date.parse(columeValue);
			} else {
				return columeValue.toUpperCase();
			}
		},
		sort: function(th, direction) {
			var index= th.index() === -1 ? 0 : th.index();
			var start = new Date(),
				self = this,
				table = this.$table,
				//body = table.find('tbody').length > 0 ? table.find('tbody') : table,
				rows = this.$thead.length > 0 ? table.find('tbody tr') : table.find('tr').has('td'),
				cells = table.find('tr td:nth-of-type(' + (index + 1) + ')'),
				sortBy = th.data().sortBy,
				sortedMap = [];

			var unsortedValues = cells.map(function(idx, cell) {
				if (sortBy)
					return (typeof sortBy === 'function') ? sortBy($(th), $(cell), self) : sortBy;
				return ($(this).data().sortValue != null ? $(this).data().sortValue : $(this).text());
			});

			if (unsortedValues.length === 0) return;

			if (direction !== 'sSortAsc' && direction !== 'sSortDesc')
				this.direction = this.direction === 'sSortAsc' ? 'sSortDesc' : 'sSortAsc';
			else
				this.direction = direction;


			direction = this.direction == 'sSortAsc' ? 1 : -1;

			self.$table.trigger('dataTable:start', [self]);
			self.log("Sorting by " + this.index + ' ' + this.direction);

			// Try to force a browser redraw
			self.$table.css("display");
			// Run sorting asynchronously on a timeout to force browser redraw after
			// `tablesort:start` callback. Also avoids locking up the browser too much.

			setTimeout(function() {
				self.$sortCells.removeClass(self.settings.sSortable + ' ' + self.settings.sSortAsc + ' ' + self.settings.sSortDesc);
				for (var i = 0, length = unsortedValues.length; i < length; i++)
				{
					sortedMap.push({
						index: i,
						cell: cells[i],
						row: rows[i],
						value: self.findSortKey(unsortedValues[i], th)
					});
				}

				sortedMap.sort(function(a, b) {
					if (a.value > b.value) {
						return 1 * direction;
					} else if (a.value < b.value) {
						return -1 * direction;
					} else {
						return 0;
					}
				});

				$.each(sortedMap, function(i, entry) {
					table.append(entry.row);
				});

				self.$sortCells.addClass(self.settings.sSortable);

				th.removeClass(self.settings.sSortable + ' ' + self.settings.sSortAsc + ' ' + self.settings.sSortDesc);
				th.addClass(self.settings[self.direction]);

				self.log('Sort finished in ' + ((new Date()).getTime() - start.getTime()) + 'ms');
				self.$table.trigger('dataTable:complete', [self]);
				//Try to force a browser redraw
				self.$table.css("display");

				self.setPaging(table);
				self.showRow(table);

				table.find('tbody tr').hide().slice(startPage, endPage).show();
			}, unsortedValues.length > 2000 ? 200 : 10);
		},
		setPaging: function(table){
			var self = this;
			$pagination.Pagination({
			       totalPages: totalPage,
			       visiblePages: totalPage,
			       onPageClick: function (event, pageSelect) {
			       	page = pageSelect;
			        startPage = (page-1) * totalRowOfPage;
			        endPage = page * totalRowOfPage;
			    	self.showRow(table);
			  }
			});
		},
		showRow: function(table){
			table.find('tbody tr').hide().slice(startPage, endPage).show();
		},
		log: function(msg) {
			if(($.dataTable.DEBUG || this.settings.debug) && console && console.log) {
				console.log('[dataTable] ' + msg);
			}
		},

		destroy: function() {
			this.$sortCells.unbind('click.dataTable');
			this.$table.data('dataTable', null);
			return null;
		}

	};

	var Pagination = function (element, options) {
	    this.$element = $(element);
	    this.options = $.extend({}, DataTable.defaults.pagination, options);

	    if (this.options.startPage < 1 || this.options.startPage > this.options.totalPages) {
	        throw new Error('Start page option is incorrect');
	    }

	    this.options.totalPages = parseInt(this.options.totalPages);
	    if (isNaN(this.options.totalPages)) {
	        throw new Error('Total pages option is not correct!');
	    }

	    this.options.visiblePages = parseInt(this.options.visiblePages);
	    if (isNaN(this.options.visiblePages)) {
	        throw new Error('Visible pages option is not correct!');
	    }

	    if (this.options.totalPages < this.options.visiblePages) {
	        this.options.visiblePages = this.options.totalPages;
	    }

	    if (this.options.onPageClick instanceof Function) {
	        this.$element.first().bind('page', this.options.onPageClick);
	    }

	    if (this.options.href) {
	        var m, regexp = this.options.href.replace(/[-\/\\^$*+?.|[\]]/g, '\\$&');
	        regexp = regexp.replace(this.options.hrefVariable, '(\\d+)');
	        if ((m = new RegExp(regexp, 'i').exec(window.location.href)) != null) {
	            this.options.startPage = parseInt(m[1], 10);
	        }
	    }

	    var tagName = (typeof this.$element.prop === 'function') ?
	        this.$element.prop('tagName') : this.$element.attr('tagName');

	    if (tagName === 'UL') {
	        this.$listContainer = this.$element;
	    } else {
	        this.$listContainer = $('<ul></ul>');
	    }

	    this.$listContainer.addClass(this.options.paginationClass);

	    if (tagName !== 'UL') {
	        this.$element.append(this.$listContainer);
	    }

	    this.render(this.getPages(this.options.startPage));
	    this.setupEvents();

	    if (this.options.initiateStartPageClick) {
	        this.$element.trigger('page', this.options.startPage);
	    }

	    return this;
	};

	Pagination.prototype = {

	    constructor: Pagination,

	    destroy: function () {
	        this.$element.empty();
	        this.$element.removeData('twbs-pagination');
	        this.$element.unbind('page');
	        return this;
	    },

	    show: function (page) {
	        if (page < 1 || page > this.options.totalPages) {
	            throw new Error('Page is incorrect.');
	        }

	        this.render(this.getPages(page));
	        this.setupEvents();

	        this.$element.trigger('page', page);
	        return this;
	    },

	    buildListItems: function (pages) {
	        var $listItems = $();

	        if (this.options.first) {
	            $listItems = $listItems.add(this.buildItem('first', 1));
	        }

	        if (this.options.prev) {
	            var prev = pages.currentPage > 1 ? pages.currentPage - 1 : this.options.loop ? this.options.totalPages  : 1;
	            $listItems = $listItems.add(this.buildItem('prev', prev));
	        }

	        for (var i = 0; i < pages.numeric.length; i++) {
	            $listItems = $listItems.add(this.buildItem('page', pages.numeric[i]));
	        }

	        if (this.options.next) {
	            var next = pages.currentPage < this.options.totalPages ? pages.currentPage + 1 : this.options.loop ? 1 : this.options.totalPages;
	            $listItems = $listItems.add(this.buildItem('next', next));
	        }

	        if (this.options.last) {
	            $listItems = $listItems.add(this.buildItem('last', this.options.totalPages));
	        }

	        return $listItems;
	    },

	    buildItem: function (type, page) {
	        var itemContainer = $('<li></li>'),
	            itemContent = $('<a></a>'),
	            itemText = null;

	        switch (type) {
	            case 'page':
	                itemText = page;
	                itemContainer.addClass(this.options.pageClass);
	                break;
	            case 'first':
	                itemText = this.options.first;
	                itemContainer.addClass(this.options.firstClass);
	                break;
	            case 'prev':
	                itemText = this.options.prev;
	                itemContainer.addClass(this.options.prevClass);
	                break;
	            case 'next':
	                itemText = this.options.next;
	                itemContainer.addClass(this.options.nextClass);
	                break;
	            case 'last':
	                itemText = this.options.last;
	                itemContainer.addClass(this.options.lastClass);
	                break;
	            default:
	                break;
	        }

	        itemContainer.data('page', page);
	        itemContainer.data('page-type', type);
	        itemContainer.append(itemContent.attr('href', this.makeHref(page)).html(itemText));

	        return itemContainer;
	    },

	    getPages: function (currentPage) {
	        var pages = [];

	        var half = Math.floor(this.options.visiblePages / 2);
	        var start = currentPage - half + 1 - this.options.visiblePages % 2;
	        var end = currentPage + half;

	        // handle boundary case
	        if (start <= 0) {
	            start = 1;
	            end = this.options.visiblePages;
	        }
	        if (end > this.options.totalPages) {
	            start = this.options.totalPages - this.options.visiblePages + 1;
	            end = this.options.totalPages;
	        }

	        

	        var itPage = start;
	        while (itPage <= end) {
	            pages.push(itPage);
	            itPage++;
	        }

	        return {"currentPage": currentPage, "numeric": pages};
	    },

	    render: function (pages) {
	        var that = this;

	        this.$listContainer.children().remove();
	        this.$listContainer.append(this.buildListItems(pages));
	        this.$listContainer.children().each(function () {
	            var $this = $(this),
	                pageType = $this.data('page-type');

	            switch (pageType) {
	                case 'page':
	                    if ($this.data('page') === pages.currentPage) {
	                        $this.addClass(that.options.activeClass);
	                    }
	                    break;
	                case 'first':
	                        $this.toggleClass(that.options.disabledClass, pages.currentPage === 1);
	                    break;
	                case 'last':
	                        $this.toggleClass(that.options.disabledClass, pages.currentPage === that.options.totalPages);
	                    break;
	                case 'prev':
	                        $this.toggleClass(that.options.disabledClass, !that.options.loop && pages.currentPage === 1);
	                    break;
	                case 'next':
	                        $this.toggleClass(that.options.disabledClass,
	                            !that.options.loop && pages.currentPage === that.options.totalPages);
	                    break;
	                default:
	                    break;
	            }

	        });
	    },

	    setupEvents: function () {
	        var base = this;
	        this.$listContainer.find('li').each(function () {
	            var $this = $(this);
	            $this.off();
	            if ($this.hasClass(base.options.disabledClass) || $this.hasClass(base.options.activeClass)) {
	                $this.click(function (evt) {
	                    evt.preventDefault();
	                });
	                return;
	            }
	            $this.click(function (evt) {
	                // Prevent click event if href is not set.
	                !base.options.href && evt.preventDefault();
	                base.show(parseInt($this.data('page'), 10));
	            });
	        });
	    },

	    makeHref: function (c) {
	        return this.options.href ? this.options.href.replace(this.options.hrefVariable, c) : "#";
	    }

	};

	$.fn.dataTable = function(settings) {
		var table, sortable, previous;
		return this.each(function() {
			table = $(this);

			previous = table.data('dataTable');

			if(previous) {
				previous.destroy();
			}
			table.data('dataTable', new $.dataTable(table, settings));
		});
	};

	$.fn.Pagination = function (option) {
	    var args = Array.prototype.slice.call(arguments, 1);
	    var methodReturn;

	    var $this = $(this);
	    
	    var data = $this.data('pagination');
	    var options = typeof option === 'object' && option;

	    //if (!data) $this.data('pagination', (data = new Pagination(this, options) ));
	    $this.data('pagination', (data = new Pagination(this, options) ));
	    if (typeof option === 'string') methodReturn = data[ option ].apply(data, args);

	    return ( methodReturn === undefined ) ? $this : methodReturn;
	};

	$.dataTable.DEBUG = false;

	DataTable={defaults:{}};
	DataTable.defaults.sort = {
		debug: $.dataTable.DEBUG,
		sSortAsc: "sorting_asc",
		sSortDesc: "sorting_desc",
		sSortable: "sorting",
		sSortableAsc: "sorting_asc_disabled",
		sSortableDesc: "sorting_desc_disabled",
		sSortableNone: "sorting_disabled",
		sSortColumn: "sorting_"
	};

	DataTable.defaults.pagination = {
		totalPages: 0,
		startPage: 1,
		visiblePages: 5,
		initiateStartPageClick: true,
		href: false,
		hrefVariable: '{{number}}',
		first: 'First',
		prev: 'Previous',
		next: 'Next',
		last: 'Last',
		loop: false,
		onPageClick: null,
		paginationClass: 'pagination',
		nextClass: 'next',
		prevClass: 'prev',
		lastClass: 'last',
		firstClass: 'first',
		pageClass: 'page',
		activeClass: 'active',
		disabledClass: 'disabled'
	};

})(jQuery, window, document);