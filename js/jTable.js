$(document).ready(function(){
	var $table, totalRow, setPaging, repaginate, totalRowOfPage, currentPage, li;
	$table = $('#dataTables-example');
	
	currentPage = 0;
	totalRowOfPage = 4;
	totalRow = $table.find('tbody tr').length;
	totalPage = Math.ceil(totalRow/totalRowOfPage);
	
	setPaging = function(){
		for(var page = 0; page < totalPage; page++){
			li = "<li><a href='#'></a></li>";
			$(".pagination").append(li);
			// $("<span></span>").text(page).click(function(){
			// 	currentPage = page;
			// 	repaginate(currentPage);
			// }).appendTo($("#paging"+page)).addClass('clickable');
		}
	};

	setPaging();

	repaginate = function(currentPage){
		console.log("currentPage="+currentPage);
		console.log("totalRowOfPage="+totalRowOfPage);
		$table.find('tbody tr').hide().slice(currentPage * totalRowOfPage, currentPage +1 * totalRowOfPage).show();
	};

	repaginate(currentPage);

	$('.sort-table').click(function(e) {
	    e.preventDefault();

	    var sortAsc = $(this).hasClass('asc'),
	        $table  = $('#dataTables-example'),
	        $rows,
	        findSortKey;

	    $('th', $table).each(function(column){
	    	var $header = $(this);

	    	if($header.is('.sort-string')){
	    		console.log("sort-string");

	    		findSortKey = function($cell){
	    			return $cell.text().toUpperCase();
	    		};

	    	} else if($header.is('.sort-numeric')){
	    		console.log("sort-numeric");
	    		findSortKey = function($cell){
	    			var key = $cell.text().replace(/^[^\d.]*/, '');
	    			key = parseFloat(key);
	    			return isNaN(key) ? 0 : key;
	    		};

	    	} else if($header.is('.sort-date')){
	    		findSortKey = function($cell){
	    			return Date.parse($cell.text());
	    		};
	    	}

	    	if(findSortKey){
	    		var sortDirection = 1;
	    		if (sortAsc) {
	    			sortDirection = -1;
	    		}

	    		$rows = $table.find('tbody > tr').get();
	    		$.each($rows, function(index, row){
	    			var $cell = $(row).children('td').eq(column);
	    			row.sortKey = findSortKey($cell);
	    		});

	    		$rows.sort(function(a, b) {
	    		    if(a.sortKey > b.sortKey) return -sortDirection;
	    		    if(a.sortKey < b.sortKey) return sortDirection;
	    		   	return 0;
	    		});

	    		$.each($rows, function(index, row){
	    		  $table.children('tbody').append(row);
	    		});
	    	}

	    });

	});
});