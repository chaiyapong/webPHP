(function ($, window, document, undefined) {
	var DataTable, page, totalRowOfPage, totalRow, totalPage, startPage, endPage, $tables, $pagination, paging;
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

    	$.dataTable.prototype.setPaging($tables.find('tbody tr'));
    	$tables.find('tbody tr').hide().slice(startPage, endPage).show();
    	$.dataTable.prototype.showTotal();
	});

	$("#searchInput").keyup(function () {
	   // var rows = $tables.find('tbody tr').hide();
	   var rows = $tables.find('tbody tr');
	    var filterRow;
	    if (this.value.length) {
	        var data = this.value.split(" ");
	        $.each(data, function (i, v) {
	            //rows.filter(":contains('" + v + "')").show();
	            //rows.filter(":contains('" + v + "')");
	        	filterRow = rows.filter(":contains('" + v + "')");

	        	totalPage = Math.ceil(filterRow.length/totalRowOfPage);
	        	startPage = (page-1) * totalRowOfPage;
	        	endPage = page * totalRowOfPage;
	        	$.dataTable.prototype.setPaging(rows, filterRow);
	        	//$tables.find('tbody tr').hide().slice(startPage, endPage).show();
	        	$.dataTable.prototype.showTotal();
	        });

	    } else {
	    	totalPage = Math.ceil(totalRow/totalRowOfPage);
    		startPage = (page-1) * totalRowOfPage;
    		endPage = page * totalRowOfPage;

    		$.dataTable.prototype.setPaging(rows);
    		$tables.find('tbody tr').hide().slice(startPage, endPage).show();
    		$.dataTable.prototype.showTotal();

	    	//rows.show();
	    }

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
		//constructor: pagination,
		pagination: function(element, options){
			thisOfpaging = element;
		    thisOfpaging.$element = $(element);
		    thisOfpaging.options = $.extend({}, DataTable.defaults.pagination, options);

		    if (thisOfpaging.options.startPage < 1 || thisOfpaging.options.startPage > thisOfpaging.options.totalPages) {
		        throw new Error('Start page option is incorrect');
		    }

		    thisOfpaging.options.totalPages = parseInt(thisOfpaging.options.totalPages);
		    if (isNaN(thisOfpaging.options.totalPages)) {
		        throw new Error('Total pages option is not correct!');
		    }

		    thisOfpaging.options.visiblePages = parseInt(thisOfpaging.options.visiblePages);
		    if (isNaN(thisOfpaging.options.visiblePages)) {
		        throw new Error('Visible pages option is not correct!');
		    }

		    if (thisOfpaging.options.totalPages < thisOfpaging.options.visiblePages) {
		        thisOfpaging.options.visiblePages = thisOfpaging.options.totalPages;
		    }

		    if (thisOfpaging.options.onPageClick instanceof Function) {
		        thisOfpaging.$element.first().bind('page', thisOfpaging.options.onPageClick);
		    }

		    if (thisOfpaging.options.href) {
		        var m, regexp = thisOfpaging.options.href.replace(/[-\/\\^$*+?.|[\]]/g, '\\$&');
		        regexp = regexp.replace(thisOfpaging.options.hrefVariable, '(\\d+)');
		        if ((m = new RegExp(regexp, 'i').exec(window.location.href)) != null) {
		            thisOfpaging.options.startPage = parseInt(m[1], 10);
		        }
		    }

		    var tagName = (typeof thisOfpaging.$element.prop === 'function') ?
		        thisOfpaging.$element.prop('tagName') : thisOfpaging.$element.attr('tagName');

		    if (tagName === 'UL') {
		        thisOfpaging.$listContainer = thisOfpaging.$element;
		    } else {
		        thisOfpaging.$listContainer = $('<ul></ul>');
		    }

		    thisOfpaging.$listContainer.addClass(thisOfpaging.options.paginationClass);

		    if (tagName !== 'UL') {
		        thisOfpaging.$element.append(thisOfpaging.$listContainer);
		    }

		    this.render(this.getPages(thisOfpaging.options.startPage));
		    this.setupEvents();

		    if (thisOfpaging.options.initiateStartPageClick) {
		        thisOfpaging.$element.trigger('page', thisOfpaging.options.startPage);
		    }

		   	this.showTotal();

		    return thisOfpaging;
		},
		destroy: function () {
		    thisOfpaging.$element.empty();
		    thisOfpaging.$element.removeData('twbs-pagination');
		    thisOfpaging.$element.unbind('page');
		    return thisOfpaging;
		},

		show: function (page) {
		    if (page < 1 || page > thisOfpaging.options.totalPages) {
		        throw new Error('Page is incorrect.');
		    }

		    this.render(this.getPages(page));
		    this.setupEvents();

		    thisOfpaging.$element.trigger('page', page);
		    return thisOfpaging;
		},

		buildListItems: function (pages) {
		    var $listItems = $();

		    if (thisOfpaging.options.first) {
		        $listItems = $listItems.add(this.buildItem('first', 1));
		    }

		    if (thisOfpaging.options.prev) {
		        var prev = pages.currentPage > 1 ? pages.currentPage - 1 : thisOfpaging.options.loop ? thisOfpaging.options.totalPages  : 1;
		        $listItems = $listItems.add(this.buildItem('prev', prev));
		    }

		    for (var i = 0; i < pages.numeric.length; i++) {
		        $listItems = $listItems.add(this.buildItem('page', pages.numeric[i]));
		    }

		    if (thisOfpaging.options.next) {
		        var next = pages.currentPage < thisOfpaging.options.totalPages ? pages.currentPage + 1 : thisOfpaging.options.loop ? 1 : thisOfpaging.options.totalPages;
		        $listItems = $listItems.add(this.buildItem('next', next));
		    }

		    if (thisOfpaging.options.last) {
		        $listItems = $listItems.add(this.buildItem('last', thisOfpaging.options.totalPages));
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
		            itemContainer.addClass(thisOfpaging.options.pageClass);
		            break;
		        case 'first':
		            itemText = thisOfpaging.options.first;
		            itemContainer.addClass(thisOfpaging.options.firstClass);
		            break;
		        case 'prev':
		            itemText = thisOfpaging.options.prev;
		            itemContainer.addClass(thisOfpaging.options.prevClass);
		            break;
		        case 'next':
		            itemText = thisOfpaging.options.next;
		            itemContainer.addClass(thisOfpaging.options.nextClass);
		            break;
		        case 'last':
		            itemText = thisOfpaging.options.last;
		            itemContainer.addClass(thisOfpaging.options.lastClass);
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

		    var half = Math.floor(thisOfpaging.options.visiblePages / 2);
		    var start = currentPage - half + 1 - thisOfpaging.options.visiblePages % 2;
		    var end = currentPage + half;

		    // handle boundary case
		    if (start <= 0) {
		        start = 1;
		        end = thisOfpaging.options.visiblePages;
		    }
		    if (end > thisOfpaging.options.totalPages) {
		        start = thisOfpaging.options.totalPages - thisOfpaging.options.visiblePages + 1;
		        end = thisOfpaging.options.totalPages;
		    }

		    

		    var itPage = start;
		    while (itPage <= end) {
		        pages.push(itPage);
		        itPage++;
		    }

		    return {"currentPage": currentPage, "numeric": pages};
		},

		render: function (pages) {
		    var that = thisOfpaging;

		    thisOfpaging.$listContainer.children().remove();
		    thisOfpaging.$listContainer.append(this.buildListItems(pages));
		    thisOfpaging.$listContainer.children().each(function () {
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
			var self = this;
		    var base = thisOfpaging;
		    thisOfpaging.$listContainer.find('li').each(function () {

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
		            self.show(parseInt($this.data('page'), 10));
		        });
		    });
		},
		showTotal: function(){
			$("#showPage").text(page);
			$("#totalOfPage").text(totalPage);
			$("#totalOfTable").text(totalRow);
		},
		makeHref: function (c) {
		    return thisOfpaging.options.href ? thisOfpaging.options.href.replace(thisOfpaging.options.hrefVariable, c) : "#";
		},
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

				self.setPaging(table.find('tbody tr'));
				self.showRow(table);

				table.find('tbody tr').hide().slice(startPage, endPage).show();
			}, unsortedValues.length > 2000 ? 200 : 10);
		},
		setPaging: function(table, filter){
			var self = this;
			$pagination.Pagination({
			       totalPages: totalPage,
			       visiblePages: totalPage,
			       onPageClick: function (event, pageSelect) {
				       	page = pageSelect;
				        startPage = (page-1) * totalRowOfPage;
				        endPage = page * totalRowOfPage;
				    	self.showRow(table, filter);
				    	self.showTotal();
			  }
			});
		},
		showRow: function(table, filter){
			var rows = table.hide();
			if(filter){
				filter.slice(startPage, endPage).show();
			}else {
				//table.hide().slice(startPage, endPage).show();
				rows.slice(startPage, endPage).show();
			}
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
	    $this.data('pagination', (data = $.dataTable.prototype.pagination(this, options) ));
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