(/** @lends <global> */function( window, document, undefined ) {
	(function( factory ) {
		factory( jQuery );
	}
	(/** @lends <global> */function( $ ) {
		"use strict";
		var DataTable;
		var _ext; // DataTable.ext
		var _Api; // DataTable.Api
		var _re_dic = {};
		var _re_escape_regex = new RegExp( '(\\' + [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\', '$', '^', '-' ].join('|\\') + ')', 'g' );

		var _empty = function ( d ) {
			return !d || d === true || d === '-' ? true : false;
		};

		function _fnAddColumn( oSettings, nTh )
		{
			// Add column to aoColumns array
			var oDefaults = DataTable.defaults.column;
			var iCol = oSettings.aoColumns.length;
			var oCol = $.extend( {}, DataTable.models.oColumn, oDefaults, {
				"nTh": nTh ? nTh : document.createElement('th'),
				"sTitle":    oDefaults.sTitle    ? oDefaults.sTitle    : nTh ? nTh.innerHTML : '',
				"aDataSort": oDefaults.aDataSort ? oDefaults.aDataSort : [iCol],
				"mData": oDefaults.mData ? oDefaults.mData : iCol,
				idx: iCol
			} );
			oSettings.aoColumns.push( oCol );
		
			var searchCols = oSettings.aoPreSearchCols;
			searchCols[ iCol ] = $.extend( {}, DataTable.models.oSearch, searchCols[ iCol ] );
		
			// Use the default column options function to initialise classes etc
			_fnColumnOptions( oSettings, iCol, $(nTh).data() );
		}

		function _fnVisibleToColumnIndex( oSettings, iMatch )
		{
			var aiVis = _fnGetColumns( oSettings, 'bVisible' );
		
			return typeof aiVis[iMatch] === 'number' ?
				aiVis[iMatch] :
				null;
		}

		function _fnGetColumns( oSettings, sParam )
		{
			var a = [];
		
			$.map( oSettings.aoColumns, function(val, i) {
				if ( val[sParam] ) {
					a.push( i );
				}
			} );
		
			return a;
		}

		function _fnScrollDraw ( settings )
		{
			var
				scroll         = settings.oScroll,
				scrollX        = scroll.sX,
				scrollXInner   = scroll.sXInner,
				scrollY        = scroll.sY,
				barWidth       = scroll.iBarWidth,
				divHeader      = $(settings.nScrollHead),
				divHeaderStyle = divHeader[0].style,
				divHeaderInner = divHeader.children('div'),
				divHeaderInnerStyle = divHeaderInner[0].style,
				divHeaderTable = divHeaderInner.children('table'),
				divBodyEl      = settings.nScrollBody,
				divBody        = $(divBodyEl),
				divBodyStyle   = divBodyEl.style,
				divFooter      = $(settings.nScrollFoot),
				divFooterInner = divFooter.children('div'),
				divFooterTable = divFooterInner.children('table'),
				header         = $(settings.nTHead),
				table          = $(settings.nTable),
				tableEl        = table[0],
				tableStyle     = tableEl.style,
				footer         = settings.nTFoot ? $(settings.nTFoot) : null,
				browser        = settings.oBrowser,
				ie67           = browser.bScrollOversize,
				headerTrgEls, footerTrgEls,
				headerSrcEls, footerSrcEls,
				headerCopy, footerCopy,
				headerWidths=[], footerWidths=[],
				headerContent=[],
				idx, correction, sanityWidth,
				zeroOut = function(nSizer) {
					var style = nSizer.style;
					style.paddingTop = "0";
					style.paddingBottom = "0";
					style.borderTopWidth = "0";
					style.borderBottomWidth = "0";
					style.height = 0;
				};
			// Remove the old minimised thead and tfoot elements in the inner table
			table.children('thead, tfoot').remove();
		
			// Clone the current header and footer elements and then place it into the inner table
			headerCopy = header.clone().prependTo( table );
			headerTrgEls = header.find('tr'); // original header is in its own table
			headerSrcEls = headerCopy.find('tr');
			headerCopy.find('th, td').removeAttr('tabindex');
		
			if ( footer ) {
				footerCopy = footer.clone().prependTo( table );
				footerTrgEls = footer.find('tr'); // the original tfoot is in its own table and must be sized
				footerSrcEls = footerCopy.find('tr');
			}
		
			if ( ! scrollX )
			{
				divBodyStyle.width = '100%';
				divHeader[0].style.width = '100%';
			}
		
			$.each( _fnGetUniqueThs( settings, headerCopy ), function ( i, el ) {
				idx = _fnVisibleToColumnIndex( settings, i );
				el.style.width = settings.aoColumns[idx].sWidth;
			} );
		
			if ( footer ) {
				_fnApplyToChildren( function(n) {
					n.style.width = "";
				}, footerSrcEls );
			}
		
			if ( scroll.bCollapse && scrollY !== "" ) {
				divBodyStyle.height = (divBody[0].offsetHeight + header[0].offsetHeight)+"px";
			}
		
			// Size the table as a whole
			sanityWidth = table.outerWidth();
			if ( scrollX === "" ) {
				// No x scrolling
				tableStyle.width = "100%";
				if ( ie67 && (table.find('tbody').height() > divBodyEl.offsetHeight ||
					divBody.css('overflow-y') == "scroll")
				) {
					tableStyle.width = _fnStringToCss( table.outerWidth() - barWidth);
				}
			}
			else
			{
				// x scrolling
				if ( scrollXInner !== "" ) {
					// x scroll inner has been given - use it
					tableStyle.width = _fnStringToCss(scrollXInner);
				}
				else if ( sanityWidth == divBody.width() && divBody.height() < table.height() ) {
					// There is y-scrolling - try to take account of the y scroll bar
					tableStyle.width = _fnStringToCss( sanityWidth-barWidth );
					if ( table.outerWidth() > sanityWidth-barWidth ) {
						// Not possible to take account of it
						tableStyle.width = _fnStringToCss( sanityWidth );
					}
				}
				else {
					// When all else fails
					tableStyle.width = _fnStringToCss( sanityWidth );
				}
			}
		
			sanityWidth = table.outerWidth();
		
			// Apply all styles in one pass
			_fnApplyToChildren( zeroOut, headerSrcEls );
		
			// Read all widths in next pass
			_fnApplyToChildren( function(nSizer) {
				headerContent.push( nSizer.innerHTML );
				headerWidths.push( _fnStringToCss( $(nSizer).css('width') ) );
			}, headerSrcEls );
		
			// Apply all widths in final pass
			_fnApplyToChildren( function(nToSize, i) {
				nToSize.style.width = headerWidths[i];
			}, headerTrgEls );
		
			$(headerSrcEls).height(0);
		
			/* Same again with the footer if we have one */
			if ( footer )
			{
				_fnApplyToChildren( zeroOut, footerSrcEls );
		
				_fnApplyToChildren( function(nSizer) {
					footerWidths.push( _fnStringToCss( $(nSizer).css('width') ) );
				}, footerSrcEls );
		
				_fnApplyToChildren( function(nToSize, i) {
					nToSize.style.width = footerWidths[i];
				}, footerTrgEls );
		
				$(footerSrcEls).height(0);
			}
		
			_fnApplyToChildren( function(nSizer, i) {
				nSizer.innerHTML = '<div class="dataTables_sizing" style="height:0;overflow:hidden;">'+headerContent[i]+'</div>';
				nSizer.style.width = headerWidths[i];
			}, headerSrcEls );
		
			if ( footer )
			{
				_fnApplyToChildren( function(nSizer, i) {
					nSizer.innerHTML = "";
					nSizer.style.width = footerWidths[i];
				}, footerSrcEls );
			}

			if ( table.outerWidth() < sanityWidth )
			{
				// The min width depends upon if we have a vertical scrollbar visible or not */
				correction = ((divBodyEl.scrollHeight > divBodyEl.offsetHeight ||
					divBody.css('overflow-y') == "scroll")) ?
						sanityWidth+barWidth :
						sanityWidth;
		
				// IE6/7 are a law unto themselves...
				if ( ie67 && (divBodyEl.scrollHeight >
					divBodyEl.offsetHeight || divBody.css('overflow-y') == "scroll")
				) {
					tableStyle.width = _fnStringToCss( correction-barWidth );
				}
		
				// And give the user a warning that we've stopped the table getting too small
				if ( scrollX === "" || scrollXInner !== "" ) {
					_fnLog( settings, 1, 'Possible column misalignment', 6 );
				}
			}
			else
			{
				correction = '100%';
			}
		
			// Apply to the container elements
			divBodyStyle.width = _fnStringToCss( correction );
			divHeaderStyle.width = _fnStringToCss( correction );
		
			if ( footer ) {
				settings.nScrollFoot.style.width = _fnStringToCss( correction );
			}
		
			if ( ! scrollY ) {
				if ( ie67 ) {
					divBodyStyle.height = _fnStringToCss( tableEl.offsetHeight+barWidth );
				}
			}
		
			if ( scrollY && scroll.bCollapse ) {
				divBodyStyle.height = _fnStringToCss( scrollY );
		
				var iExtra = (scrollX && tableEl.offsetWidth > divBodyEl.offsetWidth) ?
					barWidth :
					0;
		
				if ( tableEl.offsetHeight < divBodyEl.offsetHeight ) {
					divBodyStyle.height = _fnStringToCss( tableEl.offsetHeight+iExtra );
				}
			}
		
			/* Finally set the width's of the header and footer tables */
			var iOuterWidth = table.outerWidth();
			divHeaderTable[0].style.width = _fnStringToCss( iOuterWidth );
			divHeaderInnerStyle.width = _fnStringToCss( iOuterWidth );
		
			var bScrolling = table.height() > divBodyEl.clientHeight || divBody.css('overflow-y') == "scroll";
			var padding = 'padding' + (browser.bScrollbarLeft ? 'Left' : 'Right' );
			divHeaderInnerStyle[ padding ] = bScrolling ? barWidth+"px" : "0px";
		
			if ( footer ) {
				divFooterTable[0].style.width = _fnStringToCss( iOuterWidth );
				divFooterInner[0].style.width = _fnStringToCss( iOuterWidth );
				divFooterInner[0].style[padding] = bScrolling ? barWidth+"px" : "0px";
			}
		
			divBody.scroll();
		
			if ( (settings.bSorted || settings.bFiltered) && ! settings._drawHold ) {
				divBodyEl.scrollTop = 0;
			}
		}

		function _fnStringToCss( s )
		{
			if ( s === null ) {
				return '0px';
			}
		
			if ( typeof s == 'number' ) {
				return s < 0 ?
					'0px' :
					s+'px';
			}
		
			// Check it has a unit character already
			return s.match(/\d$/) ?
				s+'px' :
				s;
		}

		function _fnApplyToChildren( fn, an1, an2 )
		{
			var index=0, i=0, iLen=an1.length;
			var nNode1, nNode2;
		
			while ( i < iLen ) {
				nNode1 = an1[i].firstChild;
				nNode2 = an2 ? an2[i].firstChild : null;
		
				while ( nNode1 ) {
					if ( nNode1.nodeType === 1 ) {
						if ( an2 ) {
							fn( nNode1, nNode2, index );
						}
						else {
							fn( nNode1, index );
						}
		
						index++;
					}
		
					nNode1 = nNode1.nextSibling;
					nNode2 = an2 ? nNode2.nextSibling : null;
				}
		
				i++;
			}
		}

		function _fnGetUniqueThs ( oSettings, nHeader, aLayout )
		{
			var aReturn = [];
			if ( !aLayout )
			{
				aLayout = oSettings.aoHeader;
				if ( nHeader )
				{
					aLayout = [];
					_fnDetectHeader( aLayout, nHeader );
				}
			}
		
			for ( var i=0, iLen=aLayout.length ; i<iLen ; i++ )
			{
				for ( var j=0, jLen=aLayout[i].length ; j<jLen ; j++ )
				{
					if ( aLayout[i][j].unique &&
						 (!aReturn[j] || !oSettings.bSortCellsTop) )
					{
						aReturn[j] = aLayout[i][j].cell;
					}
				}
			}
		
			return aReturn;
		}

		function _fnDetectHeader ( aLayout, nThead )
		{
			//var nTrs = $(nThead).children('tr');
			var nTrs = $(nThead).children('tr');
			console.log("nTrs=");
			console.log(nTrs);
			var nTr, nCell;
			var i, k, l, iLen, jLen, iColShifted, iColumn, iColspan, iRowspan;
			var bUnique;
			var fnShiftCol = function ( a, i, j ) {
				var k = a[i];
		                while ( k[j] ) {
					j++;
				}
				return j;
			};
			
			console.log(">>aLayout");
			console.log(aLayout);

			console.log(">>nTrs.length");
			console.log(nTrs.length);

			aLayout.splice( 0, aLayout.length );
		
			/* We know how many rows there are in the layout - so prep it */
			for ( i=0, iLen=nTrs.length ; i<iLen ; i++ )
			{
				aLayout.push( [] );
			}
		
			/* Calculate a layout array */
			for ( i=0, iLen=nTrs.length ; i<iLen ; i++ )
			{
				nTr = nTrs[i];
				iColumn = 0;
		
				/* For every cell in the row... */
				nCell = nTr.firstChild;
				console.log(">>nCell");
				console.log( nTr.firstChild);

				while ( nCell ) {
					// console.log(">>toUpperCase");
					if ( nCell.nodeName.toUpperCase() == "TD" ||
					     nCell.nodeName.toUpperCase() == "TH" )
					{
						/* Get the col and rowspan attributes from the DOM and sanitise them */
						iColspan = nCell.getAttribute('colspan') * 1;
						iRowspan = nCell.getAttribute('rowspan') * 1;

						iColspan = (!iColspan || iColspan===0 || iColspan===1) ? 1 : iColspan;
						iRowspan = (!iRowspan || iRowspan===0 || iRowspan===1) ? 1 : iRowspan;
		
						/* There might be colspan cells already in this row, so shift our target
						 * accordingly
						 */
						iColShifted = fnShiftCol( aLayout, i, iColumn );
		
						/* Cache calculation for unique columns */
						bUnique = iColspan === 1 ? true : false;
		
						/* If there is col / rowspan, copy the information into the layout grid */
						for ( l=0 ; l<iColspan ; l++ )
						{
							for ( k=0 ; k<iRowspan ; k++ )
							{
								aLayout[i+k][iColShifted+l] = {
									"cell": nCell,
									"unique": bUnique
								};
								aLayout[i+k].nTr = nTr;
							}
						}
					}
					nCell = nCell.nextSibling;
				}
			}
			console.log(aLayout);
		}

		/*for icon sort asc desc*/
		function _fnSortAttachListener ( settings, attachTo, colIdx, callback )
		{
			var col = settings.aoColumns[ colIdx ];
		
			_fnBindAction( attachTo, {}, function (e) {
				/* If the column is not sortable - don't to anything */
				if ( col.bSortable === false ) {
					return;
				}
		
				// If processing is enabled use a timeout to allow the processing
				// display to be shown - otherwise to it synchronously
				if ( settings.oFeatures.bProcessing ) {
					_fnProcessingDisplay( settings, true );
		
					setTimeout( function() {
						_fnSortListener( settings, colIdx, e.shiftKey, callback );
		
						// In server-side processing, the draw callback will remove the
						// processing display
						if ( _fnDataSource( settings ) !== 'ssp' ) {
							_fnProcessingDisplay( settings, false );
						}
					}, 0 );
				}
				else {
					_fnSortListener( settings, colIdx, e.shiftKey, callback );
				}
			} );
		}

		function _fnBindAction( n, oData, fn )
		{
			$(n)
				.bind( 'click.DT', oData, function (e) {
						n.blur(); // Remove focus outline for mouse users
						fn(e);
					} )
				.bind( 'keypress.DT', oData, function (e){
						if ( e.which === 13 ) {
							e.preventDefault();
							fn(e);
						}
					} )
				.bind( 'selectstart.DT', function () {
						/* Take the brutal approach to cancelling text selection */
						return false;
					} );
		}

		function _fnReDraw( settings, holdPosition )
		{
			var
				features = settings.oFeatures,
				sort     = features.bSort,
				filter   = features.bFilter;
		
			if ( sort ) {
				_fnSort( settings );
			}
		
			if ( filter ) {
				_fnFilterComplete( settings, settings.oPreviousSearch );
			}
			else {
				// No filtering, so we want to just use the display master
				settings.aiDisplay = settings.aiDisplayMaster.slice();
			}
		
			if ( holdPosition !== true ) {
				settings._iDisplayStart = 0;
			}
		
			// Let any modules know about the draw hold position state (used by
			// scrolling internally)
			settings._drawHold = holdPosition;
		
			_fnDraw( settings );
		
			settings._drawHold = false;
		}

		function _fnSort ( oSettings )
		{
			var
				i, ien, iLen, j, jLen, k, kLen,
				sDataType, nTh,
				aiOrig = [],
				oExtSort = DataTable.ext.type.order,
				aoData = oSettings.aoData,
				aoColumns = oSettings.aoColumns,
				aDataSort, data, iCol, sType, oSort,
				formatters = 0,
				sortCol,
				displayMaster = oSettings.aiDisplayMaster,
				aSort;
		
			// Resolve any column types that are unknown due to addition or invalidation
			// @todo Can this be moved into a 'data-ready' handler which is called when
			//   data is going to be used in the table?
			_fnColumnTypes( oSettings );
		
			aSort = _fnSortFlatten( oSettings );
		
			for ( i=0, ien=aSort.length ; i<ien ; i++ ) {
				sortCol = aSort[i];
		
				// Track if we can use the fast sort algorithm
				if ( sortCol.formatter ) {
					formatters++;
				}
		
				// Load the data needed for the sort, for each cell
				_fnSortData( oSettings, sortCol.col );
			}
		
			/* No sorting required if server-side or no sorting array */
			if ( _fnDataSource( oSettings ) != 'ssp' && aSort.length !== 0 )
			{
				// Create a value - key array of the current row positions such that we can use their
				// current position during the sort, if values match, in order to perform stable sorting
				for ( i=0, iLen=displayMaster.length ; i<iLen ; i++ ) {
					aiOrig[ displayMaster[i] ] = i;
				}
		
				if ( formatters === aSort.length ) {
					// All sort types have formatting functions
					displayMaster.sort( function ( a, b ) {
						var
							x, y, k, test, sort,
							len=aSort.length,
							dataA = aoData[a]._aSortData,
							dataB = aoData[b]._aSortData;

		
						for ( k=0 ; k<len ; k++ ) {
							sort = aSort[k];
		
							x = dataA[ sort.col ];
							y = dataB[ sort.col ];
		
							test = x<y ? -1 : x>y ? 1 : 0;
							if ( test !== 0 ) {
								return sort.dir === 'asc' ? test : -test;
							}
						}
		
						x = aiOrig[a];
						y = aiOrig[b];
						return x<y ? -1 : x>y ? 1 : 0;
					} );
				}
				else {
					// Depreciated - remove in 1.11 (providing a plug-in option)
					// Not all sort types have formatting methods, so we have to call their sorting
					// methods.
					displayMaster.sort( function ( a, b ) {
						var
							x, y, k, l, test, sort, fn,
							len=aSort.length,
							dataA = aoData[a]._aSortData,
							dataB = aoData[b]._aSortData;
		
						for ( k=0 ; k<len ; k++ ) {
							sort = aSort[k];
		
							x = dataA[ sort.col ];
							y = dataB[ sort.col ];
		
							fn = oExtSort[ sort.type+"-"+sort.dir ] || oExtSort[ "string-"+sort.dir ];
							test = fn( x, y );
							if ( test !== 0 ) {
								return test;
							}
						}
		
						x = aiOrig[a];
						y = aiOrig[b];
						return x<y ? -1 : x>y ? 1 : 0;
					} );
				}
			}
		
			/* Tell the draw function that we have sorted the data */
			oSettings.bSorted = true;
		}

		function _fnDataSource ( settings )
		{
			if ( settings.oFeatures.bServerSide ) {
				return 'ssp';
			}
			else if ( settings.ajax || settings.sAjaxSource ) {
				return 'ajax';
			}
			return 'dom';
		}

		function _fnColumnTypes ( settings )
		{
			var columns = settings.aoColumns;
			var data = settings.aoData;
			var types = DataTable.ext.type.detect;
			var i, ien, j, jen, k, ken;
			var col, cell, detectedType, cache;
		
			// For each column, spin over the 
			for ( i=0, ien=columns.length ; i<ien ; i++ ) {
				col = columns[i];
				cache = [];
		
				if ( ! col.sType && col._sManualType ) {
					col.sType = col._sManualType;
				}
				else if ( ! col.sType ) {
					for ( j=0, jen=types.length ; j<jen ; j++ ) {
						for ( k=0, ken=data.length ; k<ken ; k++ ) {
							// Use a cache array so we only need to get the type data
							// from the formatter once (when using multiple detectors)
							if ( cache[k] === undefined ) {
								cache[k] = _fnGetCellData( settings, k, i, 'type' );
							}
		
							detectedType = types[j]( cache[k], settings );
							if ( ! detectedType && j !== types.length-1 ) {
								break;
							}
		
							if ( detectedType === 'html' ) {
								break;
							}
						}
		
						if ( detectedType ) {
							col.sType = detectedType;
							break;
						}
					}
		
					// Fall back - if no type was detected, always use string
					if ( ! col.sType ) {
						col.sType = 'string';
					}
				}
			}
		}

		function _fnSortFlatten ( settings )
		{
			var
				i, iLen, k, kLen,
				aSort = [],
				aiOrig = [],
				aoColumns = settings.aoColumns,
				aDataSort, iCol, sType, srcCol,
				fixed = settings.aaSortingFixed,
				fixedObj = $.isPlainObject( fixed ),
				nestedSort = [],
				add = function ( a ) {
					if ( a.length && ! $.isArray( a[0] ) ) {
						// 1D array
						nestedSort.push( a );
					}
					else {
						// 2D array
						nestedSort.push.apply( nestedSort, a );
					}
				};
		
			// Build the sort array, with pre-fix and post-fix options if they have been
			// specified
			if ( $.isArray( fixed ) ) {
				add( fixed );
			}
		
			if ( fixedObj && fixed.pre ) {
				add( fixed.pre );
			}
		
			add( settings.aaSorting );
		
			if (fixedObj && fixed.post ) {
				add( fixed.post );
			}
		
			for ( i=0 ; i<nestedSort.length ; i++ )
			{
				srcCol = nestedSort[i][0];
				aDataSort = aoColumns[ srcCol ].aDataSort;
		
				for ( k=0, kLen=aDataSort.length ; k<kLen ; k++ )
				{
					iCol = aDataSort[k];
					sType = aoColumns[ iCol ].sType || 'string';
		
					if ( nestedSort[i]._idx === undefined ) {
						nestedSort[i]._idx = $.inArray( nestedSort[i][1], aoColumns[iCol].asSorting );
					}
		
					aSort.push( {
						src:       srcCol,
						col:       iCol,
						dir:       nestedSort[i][1],
						index:     nestedSort[i]._idx,
						type:      sType,
						formatter: DataTable.ext.type.order[ sType+"-pre" ]
					} );
				}
			}
		
			return aSort;
		}

		function _fnApplyColumnDefs( oSettings, aoColDefs, aoCols, fn )
		{
			var i, iLen, j, jLen, k, kLen, def;
			var columns = oSettings.aoColumns;
		
			// Column definitions with aTargets
			if ( aoColDefs )
			{
				/* Loop over the definitions array - loop in reverse so first instance has priority */
				for ( i=aoColDefs.length-1 ; i>=0 ; i-- )
				{
					def = aoColDefs[i];
		
					/* Each definition can target multiple columns, as it is an array */
					var aTargets = def.targets !== undefined ?
						def.targets :
						def.aTargets;
		
					if ( ! $.isArray( aTargets ) )
					{
						aTargets = [ aTargets ];
					}
		
					for ( j=0, jLen=aTargets.length ; j<jLen ; j++ )
					{
						if ( typeof aTargets[j] === 'number' && aTargets[j] >= 0 )
						{
							/* Add columns that we don't yet know about */
							while( columns.length <= aTargets[j] )
							{
								_fnAddColumn( oSettings );
							}
		
							/* Integer, basic index */
							fn( aTargets[j], def );
						}
						else if ( typeof aTargets[j] === 'number' && aTargets[j] < 0 )
						{
							/* Negative integer, right to left column counting */
							fn( columns.length+aTargets[j], def );
						}
						else if ( typeof aTargets[j] === 'string' )
						{
							/* Class name matching on TH element */
							for ( k=0, kLen=columns.length ; k<kLen ; k++ )
							{
								if ( aTargets[j] == "_all" ||
								     $(columns[k].nTh).hasClass( aTargets[j] ) )
								{
									fn( k, def );
								}
							}
						}
					}
				}
			}
		
			// Statically defined columns array
			if ( aoCols )
			{
				for ( i=0, iLen=aoCols.length ; i<iLen ; i++ )
				{
					fn( i, aoCols[i] );
				}
			}
		}

		function _fnColumnOptions( oSettings, iCol, oOptions )
		{
			var oCol = oSettings.aoColumns[ iCol ];
			var oClasses = oSettings.oClasses;
			var th = $(oCol.nTh);
		
			if ( ! oCol.sWidthOrig ) {
				// Width attribute
				oCol.sWidthOrig = th.attr('width') || null;
		
				// Style attribute
				var t = (th.attr('style') || '').match(/width:\s*(\d+[pxem%]+)/);
				if ( t ) {
					oCol.sWidthOrig = t[1];
				}
			}
		
			/* User specified column options */
			if ( oOptions !== undefined && oOptions !== null )
			{
				// Backwards compatibility
				_fnCompatCols( oOptions );
		
				// Map camel case parameters to their Hungarian counterparts
				_fnCamelToHungarian( DataTable.defaults.column, oOptions );
		
				/* Backwards compatibility for mDataProp */
				if ( oOptions.mDataProp !== undefined && !oOptions.mData )
				{
					oOptions.mData = oOptions.mDataProp;
				}
		
				if ( oOptions.sType )
				{
					oCol._sManualType = oOptions.sType;
				}
		
				// `class` is a reserved word in Javascript, so we need to provide
				// the ability to use a valid name for the camel case input
				if ( oOptions.className && ! oOptions.sClass )
				{
					oOptions.sClass = oOptions.className;
				}
		
				$.extend( oCol, oOptions );
				_fnMap( oCol, oOptions, "sWidth", "sWidthOrig" );
		
				/* iDataSort to be applied (backwards compatibility), but aDataSort will take
				 * priority if defined
				 */
				if ( oOptions.iDataSort !== undefined )
				{
					oCol.aDataSort = [ oOptions.iDataSort ];
				}
				_fnMap( oCol, oOptions, "aDataSort" );
			}
		
			/* Cache the data get and set functions for speed */
			var mDataSrc = oCol.mData;
			var mData = _fnGetObjectDataFn( mDataSrc );
			var mRender = oCol.mRender ? _fnGetObjectDataFn( oCol.mRender ) : null;
		
			var attrTest = function( src ) {
				return typeof src === 'string' && src.indexOf('@') !== -1;
			};
			oCol._bAttrSrc = $.isPlainObject( mDataSrc ) && (
				attrTest(mDataSrc.sort) || attrTest(mDataSrc.type) || attrTest(mDataSrc.filter)
			);
		
			oCol.fnGetData = function (rowData, type, meta) {
				var innerData = mData( rowData, type, undefined, meta );
		
				return mRender && type ?
					mRender( innerData, type, rowData, meta ) :
					innerData;
			};
			oCol.fnSetData = function ( rowData, val, meta ) {
				return _fnSetObjectDataFn( mDataSrc )( rowData, val, meta );
			};
		
			// Indicate if DataTables should read DOM data as an object or array
			// Used in _fnGetRowElements
			if ( typeof mDataSrc !== 'number' ) {
				oSettings._rowReadObject = true;
			}
		
			/* Feature sorting overrides column specific when off */
			if ( !oSettings.oFeatures.bSort )
			{
				oCol.bSortable = false;
				th.addClass( oClasses.sSortableNone ); // Have to add class here as order event isn't called
			}
		
			/* Check that the class assignment is correct for sorting */
			var bAsc = $.inArray('asc', oCol.asSorting) !== -1;
			var bDesc = $.inArray('desc', oCol.asSorting) !== -1;
			if ( !oCol.bSortable || (!bAsc && !bDesc) )
			{
				oCol.sSortingClass = oClasses.sSortableNone;
				oCol.sSortingClassJUI = "";
			}
			else if ( bAsc && !bDesc )
			{
				oCol.sSortingClass = oClasses.sSortableAsc;
				oCol.sSortingClassJUI = oClasses.sSortJUIAscAllowed;
			}
			else if ( !bAsc && bDesc )
			{
				oCol.sSortingClass = oClasses.sSortableDesc;
				oCol.sSortingClassJUI = oClasses.sSortJUIDescAllowed;
			}
			else
			{
				oCol.sSortingClass = oClasses.sSortable;
				oCol.sSortingClassJUI = oClasses.sSortJUI;
			}
		}

		function _fnGetObjectDataFn( mSource )
		{
			if ( $.isPlainObject( mSource ) )
			{
				/* Build an object of get functions, and wrap them in a single call */
				var o = {};
				$.each( mSource, function (key, val) {
					if ( val ) {
						o[key] = _fnGetObjectDataFn( val );
					}
				} );
		
				return function (data, type, row, meta) {
					var t = o[type] || o._;
					return t !== undefined ?
						t(data, type, row, meta) :
						data;
				};
			}
			else if ( mSource === null )
			{
				/* Give an empty string for rendering / sorting etc */
				return function (data) { // type, row and meta also passed, but not used
					return data;
				};
			}
			else if ( typeof mSource === 'function' )
			{
				return function (data, type, row, meta) {
					return mSource( data, type, row, meta );
				};
			}
			else if ( typeof mSource === 'string' && (mSource.indexOf('.') !== -1 ||
				      mSource.indexOf('[') !== -1 || mSource.indexOf('(') !== -1) )
			{
				var fetchData = function (data, type, src) {
					var arrayNotation, funcNotation, out, innerSrc;
		
					if ( src !== "" )
					{
						var a = _fnSplitObjNotation( src );
		
						for ( var i=0, iLen=a.length ; i<iLen ; i++ )
						{
							// Check if we are dealing with special notation
							arrayNotation = a[i].match(__reArray);
							funcNotation = a[i].match(__reFn);
		
							if ( arrayNotation )
							{
								// Array notation
								a[i] = a[i].replace(__reArray, '');
		
								// Condition allows simply [] to be passed in
								if ( a[i] !== "" ) {
									data = data[ a[i] ];
								}
								out = [];
		
								// Get the remainder of the nested object to get
								a.splice( 0, i+1 );
								innerSrc = a.join('.');
		
								// Traverse each entry in the array getting the properties requested
								for ( var j=0, jLen=data.length ; j<jLen ; j++ ) {
									out.push( fetchData( data[j], type, innerSrc ) );
								}
		
								// If a string is given in between the array notation indicators, that
								// is used to join the strings together, otherwise an array is returned
								var join = arrayNotation[0].substring(1, arrayNotation[0].length-1);
								data = (join==="") ? out : out.join(join);
		
								// The inner call to fetchData has already traversed through the remainder
								// of the source requested, so we exit from the loop
								break;
							}
							else if ( funcNotation )
							{
								// Function call
								a[i] = a[i].replace(__reFn, '');
								data = data[ a[i] ]();
								continue;
							}
		
							if ( data === null || data[ a[i] ] === undefined )
							{
								return undefined;
							}
							data = data[ a[i] ];
						}
					}
		
					return data;
				};
		
				return function (data, type) { // row and meta also passed, but not used
					return fetchData( data, type, mSource );
				};
			}
			else
			{
				/* Array or flat object mapping */
				return function (data, type) { // row and meta also passed, but not used
					return data[mSource];
				};
			}
		}

		function _fnSetObjectDataFn( mSource )
		{
			if ( $.isPlainObject( mSource ) )
			{
				return _fnSetObjectDataFn( mSource._ );
			}
			else if ( mSource === null )
			{
				/* Nothing to do when the data source is null */
				return function () {};
			}
			else if ( typeof mSource === 'function' )
			{
				return function (data, val, meta) {
					mSource( data, 'set', val, meta );
				};
			}
			else if ( typeof mSource === 'string' && (mSource.indexOf('.') !== -1 ||
				      mSource.indexOf('[') !== -1 || mSource.indexOf('(') !== -1) )
			{
				/* Like the get, we need to get data from a nested object */
				var setData = function (data, val, src) {
					var a = _fnSplitObjNotation( src ), b;
					var aLast = a[a.length-1];
					var arrayNotation, funcNotation, o, innerSrc;
		
					for ( var i=0, iLen=a.length-1 ; i<iLen ; i++ )
					{
						// Check if we are dealing with an array notation request
						arrayNotation = a[i].match(__reArray);
						funcNotation = a[i].match(__reFn);
		
						if ( arrayNotation )
						{
							a[i] = a[i].replace(__reArray, '');
							data[ a[i] ] = [];
		
							// Get the remainder of the nested object to set so we can recurse
							b = a.slice();
							b.splice( 0, i+1 );
							innerSrc = b.join('.');
		
							// Traverse each entry in the array setting the properties requested
							for ( var j=0, jLen=val.length ; j<jLen ; j++ )
							{
								o = {};
								setData( o, val[j], innerSrc );
								data[ a[i] ].push( o );
							}
		
							// The inner call to setData has already traversed through the remainder
							// of the source and has set the data, thus we can exit here
							return;
						}
						else if ( funcNotation )
						{
							// Function call
							a[i] = a[i].replace(__reFn, '');
							data = data[ a[i] ]( val );
						}
		
						// If the nested object doesn't currently exist - since we are
						// trying to set the value - create it
						if ( data[ a[i] ] === null || data[ a[i] ] === undefined )
						{
							data[ a[i] ] = {};
						}
						data = data[ a[i] ];
					}
		
					// Last item in the input - i.e, the actual set
					if ( aLast.match(__reFn ) )
					{
						// Function call
						data = data[ aLast.replace(__reFn, '') ]( val );
					}
					else
					{
						// If array notation is used, we just want to strip it and use the property name
						// and assign the value. If it isn't used, then we get the result we want anyway
						data[ aLast.replace(__reArray, '') ] = val;
					}
				};
		
				return function (data, val) { // meta is also passed in, but not used
					return setData( data, val, mSource );
				};
			}
			else
			{
				/* Array or flat object mapping */
				return function (data, val) { // meta is also passed in, but not used
					data[mSource] = val;
				};
			}
		}

		function _fnSplitObjNotation( str )
		{
			return $.map( str.match(/(\\.|[^\.])+/g), function ( s ) {
				return s.replace(/\\./g, '.');
			} );
		}

		function _fnGetRowElements( settings, row, colIdx, d )
		{
			var
				tds = [],
				td = row.firstChild,
				name, col, o, i=0, contents,
				columns = settings.aoColumns,
				objectRead = settings._rowReadObject;
		
			// Allow the data object to be passed in, or construct
			d = d || objectRead ? {} : [];
		
			var attr = function ( str, td  ) {
				if ( typeof str === 'string' ) {
					var idx = str.indexOf('@');
		
					if ( idx !== -1 ) {
						var attr = str.substring( idx+1 );
						var setter = _fnSetObjectDataFn( str );
						setter( d, td.getAttribute( attr ) );
					}
				}
			};
		
			// Read data from a cell and store into the data object
			var cellProcess = function ( cell ) {
				if ( colIdx === undefined || colIdx === i ) {
					col = columns[i];
					contents = $.trim(cell.innerHTML);
		
					if ( col && col._bAttrSrc ) {
						var setter = _fnSetObjectDataFn( col.mData._ );
						setter( d, contents );
		
						attr( col.mData.sort, cell );
						attr( col.mData.type, cell );
						attr( col.mData.filter, cell );
					}
					else {
						// Depending on the `data` option for the columns the data can
						// be read to either an object or an array.
						if ( objectRead ) {
							if ( ! col._setter ) {
								// Cache the setter function
								col._setter = _fnSetObjectDataFn( col.mData );
							}
							col._setter( d, contents );
						}
						else {
							d[i] = contents;
						}
					}
				}
		
				i++;
			};
		
			if ( td ) {
				// `tr` element was passed in
				while ( td ) {
					name = td.nodeName.toUpperCase();
		
					if ( name == "TD" || name == "TH" ) {
						cellProcess( td );
						tds.push( td );
					}
		
					td = td.nextSibling;
				}
			}
			else {
				// Existing row object passed in
				tds = row.anCells;
				
				for ( var j=0, jen=tds.length ; j<jen ; j++ ) {
					cellProcess( tds[j] );
				}
			}
		
			return {
				data: d,
				cells: tds
			};
		}

		function _fnLoadState ( settings, oInit )
		{
			var i, ien;
			var columns = settings.aoColumns;
		
			if ( ! settings.oFeatures.bStateSave ) {
				return;
			}
		
			var state = settings.fnStateLoadCallback.call( settings.oInstance, settings );
			if ( ! state || ! state.time ) {
				return;
			}
		
			/* Allow custom and plug-in manipulation functions to alter the saved data set and
			 * cancelling of loading by returning false
			 */
			var abStateLoad = _fnCallbackFire( settings, 'aoStateLoadParams', 'stateLoadParams', [settings, state] );
			if ( $.inArray( false, abStateLoad ) !== -1 ) {
				return;
			}
		
			/* Reject old data */
			var duration = settings.iStateDuration;
			if ( duration > 0 && state.time < +new Date() - (duration*1000) ) {
				return;
			}
		
			// Number of columns have changed - all bets are off, no restore of settings
			if ( columns.length !== state.columns.length ) {
				return;
			}
		
			// Store the saved state so it might be accessed at any time
			settings.oLoadedState = $.extend( true, {}, state );
		
			// Restore key features - todo - for 1.11 this needs to be done by
			// subscribed events
			if ( state.start !== undefined ) {
				settings._iDisplayStart    = state.start;
				settings.iInitDisplayStart = state.start;
			}
			if ( state.length !== undefined ) {
				settings._iDisplayLength   = state.length;
			}
		
			// Order
			if ( state.order !== undefined ) {
				settings.aaSorting = [];
				$.each( state.order, function ( i, col ) {
					settings.aaSorting.push( col[0] >= columns.length ?
						[ 0, col[1] ] :
						col
					);
				} );
			}
		
			// Search
			if ( state.search !== undefined ) {
				$.extend( settings.oPreviousSearch, _fnSearchToHung( state.search ) );
			}
		
			// Columns
			for ( i=0, ien=state.columns.length ; i<ien ; i++ ) {
				var col = state.columns[i];
		
				// Visibility
				if ( col.visible !== undefined ) {
					columns[i].bVisible = col.visible;
				}
		
				// Search
				if ( col.search !== undefined ) {
					$.extend( settings.aoPreSearchCols[i], _fnSearchToHung( col.search ) );
				}
			}
		
			_fnCallbackFire( settings, 'aoStateLoaded', 'stateLoaded', [settings, state] );
		}

		function _fnSearchToHung ( obj )
		{
			return {
				sSearch:          obj.search,
				bSmart:           obj.smart,
				bRegex:           obj.regex,
				bCaseInsensitive: obj.caseInsensitive
			};
		}

		function _fnSortingClasses( settings )
		{
			var oldSort = settings.aLastSort;
			var sortClass = settings.oClasses.sSortColumn;
			var sort = _fnSortFlatten( settings );
			var features = settings.oFeatures;
			var i, ien, colIdx;
		
			if ( features.bSort && features.bSortClasses ) {
				// Remove old sorting classes
				for ( i=0, ien=oldSort.length ; i<ien ; i++ ) {
					colIdx = oldSort[i].src;
		
					// Remove column sorting
					$( _pluck( settings.aoData, 'anCells', colIdx ) )
						.removeClass( sortClass + (i<2 ? i+1 : 3) );
				}
		
				// Add new column sorting
				for ( i=0, ien=sort.length ; i<ien ; i++ ) {
					colIdx = sort[i].src;
		
					$( _pluck( settings.aoData, 'anCells', colIdx ) )
						.addClass( sortClass + (i<2 ? i+1 : 3) );
				}
			}
		
			settings.aLastSort = sort;
		}

		function _fnAddData ( oSettings, aDataIn, nTr, anTds )
		{
			/* Create the object for storing information about this new row */
			var iRow = oSettings.aoData.length;
			var oData = $.extend( true, {}, DataTable.models.oRow, {
				src: nTr ? 'dom' : 'data'
			} );
		
			oData._aData = aDataIn;
			oSettings.aoData.push( oData );
		
			/* Create the cells */
			var nTd, sThisType;
			var columns = oSettings.aoColumns;
			for ( var i=0, iLen=columns.length ; i<iLen ; i++ )
			{
				if ( nTr ) {
					_fnSetCellData( oSettings, iRow, i, _fnGetCellData( oSettings, iRow, i ) );
				}
				columns[i].sType = null;
			}
		
			/* Add to the display array */
			oSettings.aiDisplayMaster.push( iRow );
		
			/* Create the DOM information, or register it if already present */
			if ( nTr || ! oSettings.oFeatures.bDeferRender )
			{
				_fnCreateTr( oSettings, iRow, nTr, anTds );
			}
		
			return iRow;
		}

		function _fnSetCellData( settings, rowIdx, colIdx, val )
		{
			var col     = settings.aoColumns[colIdx];
			var rowData = settings.aoData[rowIdx]._aData;
		
			col.fnSetData( rowData, val, {
				settings: settings,
				row:      rowIdx,
				col:      colIdx
			}  );
		}

		function _fnSortAria ( settings )
		{
			var label;
			var nextSort;
			var columns = settings.aoColumns;
			var aSort = _fnSortFlatten( settings );
			var oAria = settings.oLanguage.oAria;
		
			// ARIA attributes - need to loop all columns, to update all (removing old
			// attributes as needed)
			for ( var i=0, iLen=columns.length ; i<iLen ; i++ )
			{
				var col = columns[i];
				var asSorting = col.asSorting;
				var sTitle = col.sTitle.replace( /<.*?>/g, "" );
				var th = col.nTh;
		
				// IE7 is throwing an error when setting these properties with jQuery's
				// attr() and removeAttr() methods...
				th.removeAttribute('aria-sort');
		
				/* In ARIA only the first sorting column can be marked as sorting - no multi-sort option */
				if ( col.bSortable ) {
					if ( aSort.length > 0 && aSort[0].col == i ) {
						th.setAttribute('aria-sort', aSort[0].dir=="asc" ? "ascending" : "descending" );
						nextSort = asSorting[ aSort[0].index+1 ] || asSorting[0];
					}
					else {
						nextSort = asSorting[0];
					}
		
					label = sTitle + ( nextSort === "asc" ?
						oAria.sSortAscending :
						oAria.sSortDescending
					);
				}
				else {
					label = sTitle;
				}
		
				th.setAttribute('aria-label', label);
			}
		}

		function _fnCreateTr ( oSettings, iRow, nTrIn, anTds )
		{
			var
				row = oSettings.aoData[iRow],
				rowData = row._aData,
				cells = [],
				nTr, nTd, oCol,
				i, iLen;
		
			if ( row.nTr === null )
			{
				nTr = nTrIn || document.createElement('tr');
		
				row.nTr = nTr;
				row.anCells = cells;
		
				nTr._DT_RowIndex = iRow;
		
				/* Special parameters can be given by the data source to be used on the row */
				_fnRowAttributes( row );
		
				/* Process each column */
				for ( i=0, iLen=oSettings.aoColumns.length ; i<iLen ; i++ )
				{
					oCol = oSettings.aoColumns[i];
		
					nTd = nTrIn ? anTds[i] : document.createElement( oCol.sCellType );
					cells.push( nTd );
		
					// Need to create the HTML if new, or if a rendering function is defined
					if ( !nTrIn || oCol.mRender || oCol.mData !== i )
					{
						nTd.innerHTML = _fnGetCellData( oSettings, iRow, i, 'display' );
					}
		
					/* Add user defined class */
					if ( oCol.sClass )
					{
						nTd.className += ' '+oCol.sClass;
					}
		
					// Visibility - add or remove as required
					if ( oCol.bVisible && ! nTrIn )
					{
						nTr.appendChild( nTd );
					}
					else if ( ! oCol.bVisible && nTrIn )
					{
						nTd.parentNode.removeChild( nTd );
					}
		
					if ( oCol.fnCreatedCell )
					{
						oCol.fnCreatedCell.call( oSettings.oInstance,
							nTd, _fnGetCellData( oSettings, iRow, i ), rowData, iRow, i
						);
					}
				}
		
				_fnCallbackFire( oSettings, 'aoRowCreatedCallback', null, [nTr, rowData, iRow] );
			}
		
			// Remove once webkit bug 131819 and Chromium bug 365619 have been resolved
			// and deployed
			row.nTr.setAttribute( 'role', 'row' );
		}

		function _fnBrowserDetect( settings )
		{
			var browser = settings.oBrowser;
		
			// Scrolling feature / quirks detection
			var n = $('<div/>')
				.css( {
					position: 'absolute',
					top: 0,
					left: 0,
					height: 1,
					width: 1,
					overflow: 'hidden'
				} )
				.append(
					$('<div/>')
						.css( {
							position: 'absolute',
							top: 1,
							left: 1,
							width: 100,
							overflow: 'scroll'
						} )
						.append(
							$('<div class="test"/>')
								.css( {
									width: '100%',
									height: 10
								} )
						)
				)
				.appendTo( 'body' );
		
			var test = n.find('.test');
		
			browser.bScrollOversize = test[0].offsetWidth === 100;
			browser.bScrollbarLeft = Math.round( test.offset().left ) !== 1;
		
			n.remove();
		}

		function _fnRowAttributes( row )
		{
			var tr = row.nTr;
			var data = row._aData;
		
			if ( tr ) {
				if ( data.DT_RowId ) {
					tr.id = data.DT_RowId;
				}
		
				if ( data.DT_RowClass ) {
					// Remove any classes added by DT_RowClass before
					var a = data.DT_RowClass.split(' ');
					row.__rowc = row.__rowc ?
						_unique( row.__rowc.concat( a ) ) :
						a;
		
					$(tr)
						.removeClass( row.__rowc.join(' ') )
						.addClass( data.DT_RowClass );
				}
		
				if ( data.DT_RowAttr ) {
					$(tr).attr( data.DT_RowAttr );
				}
		
				if ( data.DT_RowData ) {
					$(tr).data( data.DT_RowData );
				}
			}
		}

		function _fnAddTr( settings, trs )
		{
			var row;
		
			// Allow an individual node to be passed in
			if ( ! (trs instanceof $) ) {
				trs = $(trs);
			}
		
			return trs.map( function (i, el) {
				row = _fnGetRowElements( settings, el );
				return _fnAddData( settings, row.data, el, row.cells );
			} );
		}

		function _fnGetCellData( settings, rowIdx, colIdx, type )
		{
			var draw           = settings.iDraw;
			var col            = settings.aoColumns[colIdx];
			var rowData        = settings.aoData[rowIdx]._aData;
			var defaultContent = col.sDefaultContent;
			var cellData       = col.fnGetData( rowData, type, {
				settings: settings,
				row:      rowIdx,
				col:      colIdx
			} );
		
			if ( cellData === undefined ) {
				if ( settings.iDrawError != draw && defaultContent === null ) {
					_fnLog( settings, 0, "Requested unknown parameter "+
						(typeof col.mData=='function' ? '{function}' : "'"+col.mData+"'")+
						" for row "+rowIdx, 4 );
					settings.iDrawError = draw;
				}
				return defaultContent;
			}
		
			/* When the data source is null, we can use default column data */
			if ( (cellData === rowData || cellData === null) && defaultContent !== null ) {
				cellData = defaultContent;
			}
			else if ( typeof cellData === 'function' ) {
				// If the data source is a function, then we run it and use the return,
				// executing in the scope of the data object (for instances)
				return cellData.call( rowData );
			}
		
			if ( cellData === null && type == 'display' ) {
				return '';
			}
			return cellData;
		}

		function _fnFeatureHtmlLength ( settings )
		{
			var
				classes  = settings.oClasses,
				tableId  = settings.sTableId,
				menu     = settings.aLengthMenu,
				d2       = $.isArray( menu[0] ),
				lengths  = d2 ? menu[0] : menu,
				language = d2 ? menu[1] : menu;
		
			var select = $('<select/>', {
				'name':          tableId+'_length',
				'aria-controls': tableId,
				'class':         classes.sLengthSelect
			} );
		
			for ( var i=0, ien=lengths.length ; i<ien ; i++ ) {
				select[0][ i ] = new Option( language[i], lengths[i] );
			}
		
			var div = $('<div><label/></div>').addClass( classes.sLength );
			if ( ! settings.aanFeatures.l ) {
				div[0].id = tableId+'_length';
			}

			div.children().append(
				settings.oLanguage.sLengthMenu.replace( '_MENU_', select[0].outerHTML )
			);
		
			$('select', div)
				.val( settings._iDisplayLength )
				.bind( 'change.DT', function(e) {
					_fnLengthChange( settings, $(this).val() );
					_fnDraw( settings );
				} );
		
			// Update node value whenever anything changes the table's length
			$(settings.nTable).bind( 'length.dt.DT', function (e, s, len) {
				if ( settings === s ) {
					$('select', div).val( len );
				}
			} );
		
			return div[0];
		}

		function _fnLengthChange ( settings, val )
		{
			var len = parseInt( val, 10 );
			settings._iDisplayLength = len;
		
			_fnLengthOverflow( settings );
		
			// Fire length change event
			_fnCallbackFire( settings, null, 'length', [settings, len] );
		}

		function _fnLengthOverflow ( settings )
		{
			var
				start = settings._iDisplayStart,
				end = settings.fnDisplayEnd(),
				len = settings._iDisplayLength;
		
			/* If we have space to show extra rows (backing up from the end point - then do so */
			if ( start >= end )
			{
				start = end - len;
			}
		
			// Keep the start record on the current page
			start -= (start % len);
		
			if ( len === -1 || start < 0 )
			{
				start = 0;
			}
		
			settings._iDisplayStart = start;
		}

		function _fnFeatureHtmlFilter ( settings )
		{
			var classes = settings.oClasses;
			var tableId = settings.sTableId;
			var language = settings.oLanguage;
			var previousSearch = settings.oPreviousSearch;
			var features = settings.aanFeatures;

			var input = '<input type="search" class="'+classes.sFilterInput+'"/>';
		
			var str = language.sSearch;
			str = str.match(/_INPUT_/) ? str.replace('_INPUT_', input) : str+input;
		
			var filter = $('<div/>', {
					'id': ! features.f ? tableId+'_filter' : null,
					'class': classes.sFilter
				} )
				.append( $('<label/>' ).append( str ) );
		
			var searchFn = function() {
				/* Update all other filter input elements for the new display */
				var n = features.f;
				var val = !this.value ? "" : this.value; // mental IE8 fix :-(

				/* Now do the filter */
				if ( val != previousSearch.sSearch ) {
					_fnFilterComplete( settings, {
						"sSearch": val,
						"bRegex": previousSearch.bRegex,
						"bSmart": previousSearch.bSmart ,
						"bCaseInsensitive": previousSearch.bCaseInsensitive
					} );
		
					// Need to redraw, without resorting
					settings._iDisplayStart = 0;
					_fnDraw( settings );
				}
			};
		
			var searchDelay = settings.searchDelay !== null ?
				settings.searchDelay :
				_fnDataSource( settings ) === 'ssp' ? 400 : 0;
		
			var jqFilter = $('input', filter)
				.val( previousSearch.sSearch )
				.attr( 'placeholder', language.sSearchPlaceholder )
				.bind(
					'keyup.DT search.DT input.DT paste.DT cut.DT',
					searchDelay ? _fnThrottle( searchFn, searchDelay ) : searchFn
				)
				.bind( 'keypress.DT', function(e) {
					/* Prevent form submission */
					if ( e.keyCode == 13 ) {
						return false;
					}
				} )
				.attr('aria-controls', tableId);
		
			// Update the input elements whenever the table is filtered
			$(settings.nTable).on( 'search.dt.DT', function ( ev, s ) {
				if ( settings === s ) {
					// IE9 throws an 'unknown error' if document.activeElement is used
					// inside an iframe or frame...
					try {
						if ( jqFilter[0] !== document.activeElement ) {
							jqFilter.val( previousSearch.sSearch );
						}
					}
					catch ( e ) {}
				}
			} );

		
			return filter[0];
		}

		function _fnFeatureHtmlTable ( settings )
		{
			var table = $(settings.nTable);
			// Add the ARIA grid role to the table
			table.attr( 'role', 'grid' );
		
			// Scrolling from here on in
			var scroll = settings.oScroll;
		
			if ( scroll.sX === '' && scroll.sY === '' ) {
				return settings.nTable;
			}
		
			var scrollX = scroll.sX;
			var scrollY = scroll.sY;
			var classes = settings.oClasses;
			var caption = table.children('caption');
			var captionSide = caption.length ? caption[0]._captionSide : null;
			var headerClone = $( table[0].cloneNode(false) );
			var footerClone = $( table[0].cloneNode(false) );
			var footer = table.children('tfoot');
			var _div = '<div/>';

			var size = function ( s ) {
				return !s ? null : _fnStringToCss( s );
			};
		
			if ( scroll.sX && table.attr('width') === '100%' ) {
				table.removeAttr('width');
			}
		
			if ( ! footer.length ) {
				footer = null;
			}

			var scroller = $( _div, { 'class': classes.sScrollWrapper } )
				.append(
					$(_div, { 'class': classes.sScrollHead } )
						.css( {
							overflow: 'hidden',
							position: 'relative',
							border: 0,
							width: scrollX ? size(scrollX) : '100%'
						} )
						.append(
							$(_div, { 'class': classes.sScrollHeadInner } )
								.css( {
									'box-sizing': 'content-box',
									width: scroll.sXInner || '100%'
								} )
								.append(
									headerClone
										.removeAttr('id')
										.css( 'margin-left', 0 )
										.append( captionSide === 'top' ? caption : null )
										.append(
											table.children('thead')
										)
								)
						)
				)
				.append(
					$(_div, { 'class': classes.sScrollBody } )
						.css( {
							overflow: 'auto',
							height: size( scrollY ),
							width: size( scrollX )
						} )
						.append( table )
				);
		
			if ( footer ) {
				scroller.append(
					$(_div, { 'class': classes.sScrollFoot } )
						.css( {
							overflow: 'hidden',
							border: 0,
							width: scrollX ? size(scrollX) : '100%'
						} )
						.append(
							$(_div, { 'class': classes.sScrollFootInner } )
								.append(
									footerClone
										.removeAttr('id')
										.css( 'margin-left', 0 )
										.append( captionSide === 'bottom' ? caption : null )
										.append(
											table.children('tfoot')
										)
								)
						)
				);
			}
		
			var children = scroller.children();
			var scrollHead = children[0];
			var scrollBody = children[1];
			var scrollFoot = footer ? children[2] : null;
		
			// When the body is scrolled, then we also want to scroll the headers
			if ( scrollX ) {
				$(scrollBody).on( 'scroll.DT', function (e) {
					var scrollLeft = this.scrollLeft;
		
					scrollHead.scrollLeft = scrollLeft;
		
					if ( footer ) {
						scrollFoot.scrollLeft = scrollLeft;
					}
				} );
			}
		
			settings.nScrollHead = scrollHead;
			settings.nScrollBody = scrollBody;
			settings.nScrollFoot = scrollFoot;
		
			// On redraw - align columns
			settings.aoDrawCallback.push( {
				"fn": _fnScrollDraw,
				"sName": "scrolling"
			} );
		
			return scroller[0];
		}

		function _fnFeatureHtmlPaginate ( settings )
		{
			var
				type   = settings.sPaginationType,
				plugin = DataTable.ext.pager[ type ],
				modern = typeof plugin === 'function',
				redraw = function( settings ) {
					_fnDraw( settings );
				},
				node = $('<div/>').addClass( settings.oClasses.sPaging + type )[0],
				features = settings.aanFeatures;
		
			if ( ! modern ) {
				plugin.fnInit( settings, node, redraw );
			}
		
			/* Add a draw callback for the pagination on first instance, to update the paging display */
			if ( ! features.p )
			{
				node.id = settings.sTableId+'_paginate';
		
				settings.aoDrawCallback.push( {
					"fn": function( settings ) {
						if ( modern ) {
							var
								start      = settings._iDisplayStart,
								len        = settings._iDisplayLength,
								visRecords = settings.fnRecordsDisplay(),
								all        = len === -1,
								page = all ? 0 : Math.ceil( start / len ),
								pages = all ? 1 : Math.ceil( visRecords / len ),
								buttons = plugin(page, pages),
								i, ien;
		
							for ( i=0, ien=features.p.length ; i<ien ; i++ ) {	
								_fnRenderer( settings, 'pageButton' )(
									settings, features.p[i], i, buttons, page, pages
								);
							}
						}
						else {
							plugin.fnUpdate( settings, redraw );
						}
					},
					"sName": "pagination"
				} );
			}
		
			return node;
		}


		function _fnRenderer( settings, type )
		{
			var renderer = settings.renderer;
			var host = DataTable.ext.renderer[type];
		
			if ( $.isPlainObject( renderer ) && renderer[type] ) {
				return host[renderer[type]] || host._;
			}
			else if ( typeof renderer === 'string' ) {
				return host[renderer] || host._;
			}
		
			// Use the default
			return host._;
		}

		function _fnVisbleColumns( oSettings )
		{
			return _fnGetColumns( oSettings, 'bVisible' ).length;
		}

		function _fnSortData( settings, idx )
		{
			// Custom sorting function - provided by the sort data type
			var column = settings.aoColumns[ idx ];
			var customSort = DataTable.ext.order[ column.sSortDataType ];
			var customData;
		
			if ( customSort ) {
				customData = customSort.call( settings.oInstance, settings, idx,
					_fnColumnIndexToVisible( settings, idx )
				);
			}
		
			// Use / populate cache
			var row, cellData;
			var formatter = DataTable.ext.type.order[ column.sType+"-pre" ];
		
			for ( var i=0, ien=settings.aoData.length ; i<ien ; i++ ) {
				row = settings.aoData[i];
				//console.log(row._aData[0]);
		
				if ( ! row._aSortData ) {
					row._aSortData = [];
				}

				if ( ! row._aSortData[idx] || customSort ) {
					cellData = customSort ?
						customData[i] : // If there was a custom sort function, use data from there
						_fnGetCellData( settings, i, idx, 'sort' );
		
					row._aSortData[ idx ] = formatter ?
						formatter( cellData ) :
						cellData;
				}
				// console.log(cellData);
			}
		}

		function _fnColumnIndexToVisible( oSettings, iMatch )
		{
			var aiVis = _fnGetColumns( oSettings, 'bVisible' );
			var iPos = $.inArray( iMatch, aiVis );
		
			return iPos !== -1 ? iPos : null;
		}

		function _fnFilterComplete ( oSettings, oInput, iForce )
		{
			var oPrevSearch = oSettings.oPreviousSearch;
			var aoPrevSearch = oSettings.aoPreSearchCols;
			var fnSaveFilter = function ( oFilter ) {
				/* Save the filtering values */
				oPrevSearch.sSearch = oFilter.sSearch;
				oPrevSearch.bRegex = oFilter.bRegex;
				oPrevSearch.bSmart = oFilter.bSmart;
				oPrevSearch.bCaseInsensitive = oFilter.bCaseInsensitive;
			};
			var fnRegex = function ( o ) {
				// Backwards compatibility with the bEscapeRegex option
				return o.bEscapeRegex !== undefined ? !o.bEscapeRegex : o.bRegex;
			};
		
			// Resolve any column types that are unknown due to addition or invalidation
			// @todo As per sort - can this be moved into an event handler?
			_fnColumnTypes( oSettings );
		
			/* In server-side processing all filtering is done by the server, so no point hanging around here */
			if ( _fnDataSource( oSettings ) != 'ssp' )
			{
				/* Global filter */
				_fnFilter( oSettings, oInput.sSearch, iForce, fnRegex(oInput), oInput.bSmart, oInput.bCaseInsensitive );
				fnSaveFilter( oInput );
		
				/* Now do the individual column filter */
				for ( var i=0 ; i<aoPrevSearch.length ; i++ )
				{
					_fnFilterColumn( oSettings, aoPrevSearch[i].sSearch, i, fnRegex(aoPrevSearch[i]),
						aoPrevSearch[i].bSmart, aoPrevSearch[i].bCaseInsensitive );
				}
		
				/* Custom filtering */
				_fnFilterCustom( oSettings );
			}
			else
			{
				fnSaveFilter( oInput );
			}
		
			/* Tell the draw function we have been filtering */
			oSettings.bFiltered = true;
			_fnCallbackFire( oSettings, null, 'search', [oSettings] );
		}

		function _fnFilter( settings, input, force, regex, smart, caseInsensitive )
		{
			var rpSearch = _fnFilterCreateSearch( input, regex, smart, caseInsensitive );
			var prevSearch = settings.oPreviousSearch.sSearch;
			var displayMaster = settings.aiDisplayMaster;
			var display, invalidated, i;
		
			// Need to take account of custom filtering functions - always filter
			if ( DataTable.ext.search.length !== 0 ) {
				force = true;
			}
		
			// Check if any of the rows were invalidated
			invalidated = _fnFilterData( settings );
		
			// If the input is blank - we just want the full data set
			if ( input.length <= 0 ) {
				settings.aiDisplay = displayMaster.slice();
			}
			else {
				// New search - start from the master array
				if ( invalidated ||
					 force ||
					 prevSearch.length > input.length ||
					 input.indexOf(prevSearch) !== 0 ||
					 settings.bSorted // On resort, the display master needs to be
					                  // re-filtered since indexes will have changed
				) {
					settings.aiDisplay = displayMaster.slice();
				}
		
				// Search the display array
				display = settings.aiDisplay;
		
				for ( i=display.length-1 ; i>=0 ; i-- ) {
					if ( ! rpSearch.test( settings.aoData[ display[i] ]._sFilterRow ) ) {
						display.splice( i, 1 );
					}
				}
			}
		}

		function _fnFilterCreateSearch( search, regex, smart, caseInsensitive )
		{
			search = regex ?
				search :
				_fnEscapeRegex( search );
			
			if ( smart ) {
				var a = $.map( search.match( /"[^"]+"|[^ ]+/g ) || '', function ( word ) {
					if ( word.charAt(0) === '"' ) {
						var m = word.match( /^"(.*)"$/ );
						word = m ? m[1] : word;
					}
		
					return word.replace('"', '');
				} );
		
				search = '^(?=.*?'+a.join( ')(?=.*?' )+').*$';
			}
		
			return new RegExp( search, caseInsensitive ? 'i' : '' );
		}

		// Update the filtering data for each row if needed (by invalidation or first run)
		function _fnFilterData ( settings )
		{
			var columns = settings.aoColumns;
			var column;
			var i, j, ien, jen, filterData, cellData, row;
			var fomatters = DataTable.ext.type.search;
			var wasInvalidated = false;
		
			for ( i=0, ien=settings.aoData.length ; i<ien ; i++ ) {
				row = settings.aoData[i];
		
				if ( ! row._aFilterData ) {
					filterData = [];
		
					for ( j=0, jen=columns.length ; j<jen ; j++ ) {
						column = columns[j];
		
						if ( column.bSearchable ) {
							cellData = _fnGetCellData( settings, i, j, 'filter' );
		
							if ( fomatters[ column.sType ] ) {
								cellData = fomatters[ column.sType ]( cellData );
							}
		
							// Search in DataTables 1.10 is string based. In 1.11 this
							// should be altered to also allow strict type checking.
							if ( cellData === null ) {
								cellData = '';
							}
		
							if ( typeof cellData !== 'string' && cellData.toString ) {
								cellData = cellData.toString();
							}
						}
						else {
							cellData = '';
						}
		
						if ( cellData.indexOf && cellData.indexOf('&') !== -1 ) {
							__filter_div.innerHTML = cellData;
							cellData = __filter_div_textContent ?
								__filter_div.textContent :
								__filter_div.innerText;
						}
		
						if ( cellData.replace ) {
							cellData = cellData.replace(/[\r\n]/g, '');
						}
		
						filterData.push( cellData );
					}
		
					row._aFilterData = filterData;
					row._sFilterRow = filterData.join('  ');
					wasInvalidated = true;
				}
			}
		
			return wasInvalidated;
		}

		function _fnFilterColumn ( settings, searchStr, colIdx, regex, smart, caseInsensitive )
		{
			if ( searchStr === '' ) {
				return;
			}
		
			var data;
			var display = settings.aiDisplay;
			var rpSearch = _fnFilterCreateSearch( searchStr, regex, smart, caseInsensitive );
		
			for ( var i=display.length-1 ; i>=0 ; i-- ) {
				data = settings.aoData[ display[i] ]._aFilterData[ colIdx ];
		
				if ( ! rpSearch.test( data ) ) {
					display.splice( i, 1 );
				}
			}
		}

		function _fnFilterCustom( settings )
		{
			var filters = DataTable.ext.search;
			var displayRows = settings.aiDisplay;
			var row, rowIdx;
		
			for ( var i=0, ien=filters.length ; i<ien ; i++ ) {
				var rows = [];
		
				// Loop over each row and see if it should be included
				for ( var j=0, jen=displayRows.length ; j<jen ; j++ ) {
					rowIdx = displayRows[ j ];
					row = settings.aoData[ rowIdx ];
		
					if ( filters[i]( settings, row._aFilterData, rowIdx, row._aData, j ) ) {
						rows.push( rowIdx );
					}
				}
		
				// So the array reference doesn't break set the results into the
				// existing array
				displayRows.length = 0;
				displayRows.push.apply( displayRows, rows );
			}
		}

		function _fnDraw( oSettings )
		{
			/* draw to html page */
			/* Provide a pre-callback function which can be used to cancel the draw is false is returned */
			var aPreDraw = _fnCallbackFire( oSettings, 'aoPreDrawCallback', 'preDraw', [oSettings] );
			if ( $.inArray( false, aPreDraw ) !== -1 )
			{
				_fnProcessingDisplay( oSettings, false );
				return;
			}
		
			var i, iLen, n;
			var anRows = [];
			var iRowCount = 0;
			var asStripeClasses = oSettings.asStripeClasses;
			var iStripes = asStripeClasses.length;
			var iOpenRows = oSettings.aoOpenRows.length;
			var oLang = oSettings.oLanguage;
			var iInitDisplayStart = oSettings.iInitDisplayStart;
			var bServerSide = _fnDataSource( oSettings ) == 'ssp';
			var aiDisplay = oSettings.aiDisplay;
		
			oSettings.bDrawing = true;
		
			/* Check and see if we have an initial draw position from state saving */
			if ( iInitDisplayStart !== undefined && iInitDisplayStart !== -1 )
			{
				oSettings._iDisplayStart = bServerSide ?
					iInitDisplayStart :
					iInitDisplayStart >= oSettings.fnRecordsDisplay() ?
						0 :
						iInitDisplayStart;
		
				oSettings.iInitDisplayStart = -1;
			}
		
			var iDisplayStart = oSettings._iDisplayStart;
			var iDisplayEnd = oSettings.fnDisplayEnd();
		
			/* Server-side processing draw intercept */
			if ( oSettings.bDeferLoading )
			{
				oSettings.bDeferLoading = false;
				oSettings.iDraw++;
				_fnProcessingDisplay( oSettings, false );
			}
			else if ( !bServerSide )
			{
				oSettings.iDraw++;
			}
			else if ( !oSettings.bDestroying && !_fnAjaxUpdate( oSettings ) )
			{
				return;
			}
		
			if ( aiDisplay.length !== 0 )
			{
				var iStart = bServerSide ? 0 : iDisplayStart;
				var iEnd = bServerSide ? oSettings.aoData.length : iDisplayEnd;
		
				for ( var j=iStart ; j<iEnd ; j++ )
				{
					var iDataIndex = aiDisplay[j];
					var aoData = oSettings.aoData[ iDataIndex ];
					if ( aoData.nTr === null )
					{
						_fnCreateTr( oSettings, iDataIndex );
					}
		
					var nRow = aoData.nTr;
		
					/* Remove the old striping classes and then add the new one */
					if ( iStripes !== 0 )
					{
						var sStripe = asStripeClasses[ iRowCount % iStripes ];
						if ( aoData._sRowStripe != sStripe )
						{
							$(nRow).removeClass( aoData._sRowStripe ).addClass( sStripe );
							aoData._sRowStripe = sStripe;
						}
					}
		
					// Row callback functions - might want to manipulate the row
					// iRowCount and j are not currently documented. Are they at all
					// useful?
					_fnCallbackFire( oSettings, 'aoRowCallback', null,
						[nRow, aoData._aData, iRowCount, j] );
		
					anRows.push( nRow );
					iRowCount++;
				}
			}
			else
			{
				/* Table is empty - create a row with an empty message in it */
				var sZero = oLang.sZeroRecords;
				if ( oSettings.iDraw == 1 &&  _fnDataSource( oSettings ) == 'ajax' )
				{
					sZero = oLang.sLoadingRecords;
				}
				else if ( oLang.sEmptyTable && oSettings.fnRecordsTotal() === 0 )
				{
					sZero = oLang.sEmptyTable;
				}
		
				anRows[ 0 ] = $( '<tr/>', { 'class': iStripes ? asStripeClasses[0] : '' } )
					.append( $('<td />', {
						'valign':  'top',
						'colSpan': _fnVisbleColumns( oSettings ),
						'class':   oSettings.oClasses.sRowEmpty
					} ).html( sZero ) )[0];
			}
		
			/* Header and footer callbacks */
			_fnCallbackFire( oSettings, 'aoHeaderCallback', 'header', [ $(oSettings.nTHead).children('tr')[0],
				_fnGetDataMaster( oSettings ), iDisplayStart, iDisplayEnd, aiDisplay ] );
		
			_fnCallbackFire( oSettings, 'aoFooterCallback', 'footer', [ $(oSettings.nTFoot).children('tr')[0],
				_fnGetDataMaster( oSettings ), iDisplayStart, iDisplayEnd, aiDisplay ] );
		
			var body = $(oSettings.nTBody);
		
			body.children().detach();
			body.append( $(anRows) );
		
			/* Call all required callback functions for the end of a draw */
			_fnCallbackFire( oSettings, 'aoDrawCallback', 'draw', [oSettings] );
		
			/* Draw is complete, sorting and filtering must be as well */
			oSettings.bSorted = false;
			oSettings.bFiltered = false;
			oSettings.bDrawing = false;
		}

		function _fnGetDataMaster ( settings )
		{
			return _pluck( settings.aoData, '_aData' );
		}

		function _fnInitComplete ( settings, json )
		{
			settings._bInitComplete = true;
		
			// On an Ajax load we now have data and therefore want to apply the column
			// sizing
			if ( json ) {
				_fnAdjustColumnSizing( settings );
			}
		
			_fnCallbackFire( settings, 'aoInitComplete', 'init', [settings, json] );
		}

		function _fnAdjustColumnSizing ( settings )
		{
			/* Not interested in doing column width calculation if auto-width is disabled */
			if ( settings.oFeatures.bAutoWidth !== false )
			{
				var columns = settings.aoColumns;
		
				_fnCalculateColumnWidths( settings );
				for ( var i=0 , iLen=columns.length ; i<iLen ; i++ )
				{
					columns[i].nTh.style.width = columns[i].sWidth;
				}
			}
		
			var scroll = settings.oScroll;
			if ( scroll.sY !== '' || scroll.sX !== '')
			{
				_fnScrollDraw( settings );
			}
		
			_fnCallbackFire( settings, null, 'column-sizing', [settings] );
		}

		function _fnPageChange ( settings, action, redraw )
		{
			var
				start     = settings._iDisplayStart,
				len       = settings._iDisplayLength,
				records   = settings.fnRecordsDisplay();
		
			if ( records === 0 || len === -1 )
			{
				start = 0;
			}
			else if ( typeof action === "number" )
			{
				start = action * len;
		
				if ( start > records )
				{
					start = 0;
				}
			}
			else if ( action == "first" )
			{
				start = 0;
			}
			else if ( action == "previous" )
			{
				start = len >= 0 ?
					start - len :
					0;
		
				if ( start < 0 )
				{
				  start = 0;
				}
			}
			else if ( action == "next" )
			{
				if ( start + len < records )
				{
					start += len;
				}
			}
			else if ( action == "last" )
			{
				start = Math.floor( (records-1) / len) * len;
			}
			else
			{
				_fnLog( settings, 0, "Unknown paging action: "+action, 5 );
			}
		
			var changed = settings._iDisplayStart !== start;
			settings._iDisplayStart = start;
		
			if ( changed ) {
				_fnCallbackFire( settings, null, 'page', [settings] );
		
				if ( redraw ) {
					_fnDraw( settings );
				}
			}
		
			return changed;
		}

		/*for sort data*/
		function _fnSortListener ( settings, colIdx, append, callback )
		{
			var col = settings.aoColumns[ colIdx ];
			var sorting = settings.aaSorting;
			var asSorting = col.asSorting;
			var nextSortIdx;

			var next = function ( a, overflow ) {
				var idx = a._idx;
				if ( idx === undefined ) {
					idx = $.inArray( a[1], asSorting );
				}
		
				return idx+1 < asSorting.length ?
					idx+1 :
					overflow ?
						null :
						0;
			};
			
			// Convert to 2D array if needed
			if ( typeof sorting[0] === 'number' ) {
				sorting = settings.aaSorting = [ sorting ];
			}
		
			// If appending the sort then we are multi-column sorting
			if ( append && settings.oFeatures.bSortMulti ) {
				// Are we already doing some kind of sort on this column?
				var sortIdx = $.inArray( colIdx, _pluck(sorting, '0') );
		
				if ( sortIdx !== -1 ) {
					// Yes, modify the sort
					nextSortIdx = next( sorting[sortIdx], true );
		
					if ( nextSortIdx === null && sorting.length === 1 ) {
						nextSortIdx = 0; // can't remove sorting completely
					}
		
					if ( nextSortIdx === null ) {
						sorting.splice( sortIdx, 1 );
					}
					else {
						sorting[sortIdx][1] = asSorting[ nextSortIdx ];
						sorting[sortIdx]._idx = nextSortIdx;
					}
				}
				else {
					// No sort on this column yet
					sorting.push( [ colIdx, asSorting[0], 0 ] );
					sorting[sorting.length-1]._idx = 0;
				}
			}
			else if ( sorting.length && sorting[0][0] == colIdx ) {
				// Single column - already sorting on this column, modify the sort
				nextSortIdx = next( sorting[0] );
		
				sorting.length = 1;
				sorting[0][1] = asSorting[ nextSortIdx ];
				sorting[0]._idx = nextSortIdx;

				//console.log(sorting[0]._idx);
			}
			else {
				// Single column - sort only on this column
				sorting.length = 0;
				sorting.push( [ colIdx, asSorting[0] ] );
				sorting[0]._idx = 0;
			}
		
			// Run the sort by calling a full redraw
			_fnReDraw( settings );
		
			// callback used for async user interaction
			if ( typeof callback == 'function' ) {
				callback( settings );
			}
		}

		DataTable = function( options ){

		 	this.$ = function ( sSelector, oOpts )
		 	{
		 		return this.api(true).$( sSelector, oOpts );
		 	};

		 	this._ = function ( sSelector, oOpts )
		 	{
		 		return this.api(true).rows( sSelector, oOpts ).data();
		 	};

		 	this.api = function ( traditional )
			{
				return traditional ?
				new _Api(
					_fnSettingsFromNode( this[ _ext.iApiIndex ] )
				) :
				new _Api( this );
			};

			this.fnAddData = function( data, redraw )
			{
				var api = this.api( true );
			
				/* Check if we want to add multiple rows or not */
				var rows = $.isArray(data) && ( $.isArray(data[0]) || $.isPlainObject(data[0]) ) ?
					api.rows.add( data ) :
					api.row.add( data );
			
				if ( redraw === undefined || redraw ) {
					api.draw();
				}
			
				return rows.flatten().toArray();
			};

			this.fnAdjustColumnSizing = function ( bRedraw )
			{
				var api = this.api( true ).columns.adjust();
				var settings = api.settings()[0];
				var scroll = settings.oScroll;
			
				if ( bRedraw === undefined || bRedraw ) {
					api.draw( false );
				}
				else if ( scroll.sX !== "" || scroll.sY !== "" ) {
					/* If not redrawing, but scrolling, we want to apply the new column sizes anyway */
					_fnScrollDraw( settings );
				}
			};

			this.fnClearTable = function( bRedraw )
			{
				var api = this.api( true ).clear();
			
				if ( bRedraw === undefined || bRedraw ) {
					api.draw();
				}
			};
			
			this.fnClose = function( nTr )
			{
				this.api( true ).row( nTr ).child.hide();
			};

			this.fnDeleteRow = function( target, callback, redraw )
			{
				var api = this.api( true );
				var rows = api.rows( target );
				var settings = rows.settings()[0];
				var data = settings.aoData[ rows[0][0] ];
			
				rows.remove();
			
				if ( callback ) {
					callback.call( this, settings, data );
				}
			
				if ( redraw === undefined || redraw ) {
					api.draw();
				}
			
				return data;
			};
			
			this.fnDestroy = function ( remove )
			{
				this.api( true ).destroy( remove );
			};
			
			this.fnDraw = function( complete )
			{
				this.api( true ).draw( complete );
			};
			
			this.fnFilter = function( sInput, iColumn, bRegex, bSmart, bShowGlobal, bCaseInsensitive )
			{
				var api = this.api( true );
			
				if ( iColumn === null || iColumn === undefined ) {
					api.search( sInput, bRegex, bSmart, bCaseInsensitive );
				}
				else {
					api.column( iColumn ).search( sInput, bRegex, bSmart, bCaseInsensitive );
				}
			
				api.draw();
			};
			
			this.fnGetData = function( src, col )
			{
				var api = this.api( true );
			
				if ( src !== undefined ) {
					var type = src.nodeName ? src.nodeName.toLowerCase() : '';
			
					return col !== undefined || type == 'td' || type == 'th' ?
						api.cell( src, col ).data() :
						api.row( src ).data() || null;
				}
			
				return api.data().toArray();
			};
			
			this.fnGetNodes = function( iRow )
			{
				var api = this.api( true );
			
				return iRow !== undefined ?
					api.row( iRow ).node() :
					api.rows().nodes().flatten().toArray();
			};
			
			this.fnGetPosition = function( node )
			{
				var api = this.api( true );
				var nodeName = node.nodeName.toUpperCase();
			
				if ( nodeName == 'TR' ) {
					return api.row( node ).index();
				}
				else if ( nodeName == 'TD' || nodeName == 'TH' ) {
					var cell = api.cell( node ).index();
			
					return [
						cell.row,
						cell.columnVisible,
						cell.column
					];
				}
				return null;
			};
			
			this.fnIsOpen = function( nTr )
			{
				return this.api( true ).row( nTr ).child.isShown();
			};
			
			this.fnOpen = function( nTr, mHtml, sClass )
			{
				return this.api( true )
					.row( nTr )
					.child( mHtml, sClass )
					.show()
					.child()[0];
			};
			
			this.fnPageChange = function ( mAction, bRedraw )
			{
				var api = this.api( true ).page( mAction );
			
				if ( bRedraw === undefined || bRedraw ) {
					api.draw(false);
				}
			};
			
			this.fnSetColumnVis = function ( iCol, bShow, bRedraw )
			{
				var api = this.api( true ).column( iCol ).visible( bShow );
			
				if ( bRedraw === undefined || bRedraw ) {
					api.columns.adjust().draw();
				}
			};
			
			this.fnSettings = function()
			{
				return _fnSettingsFromNode( this[_ext.iApiIndex] );
			};
			
			this.fnSort = function( aaSort )
			{
				this.api( true ).order( aaSort ).draw();
			};
			
			this.fnSortListener = function( nNode, iColumn, fnCallback )
			{
				this.api( true ).order.listener( nNode, iColumn, fnCallback );
			};
			
			this.fnUpdate = function( mData, mRow, iColumn, bRedraw, bAction )
			{
				var api = this.api( true );
			
				if ( iColumn === undefined || iColumn === null ) {
					api.row( mRow ).data( mData );
				}
				else {
					api.cell( mRow, iColumn ).data( mData );
				}
			
				if ( bAction === undefined || bAction ) {
					api.columns.adjust();
				}
			
				if ( bRedraw === undefined || bRedraw ) {
					api.draw();
				}
				return 0;
			};
			
			this.fnVersionCheck = _ext.fnVersionCheck;
			var _that = this;
			var emptyInit = options === undefined;
			var len = this.length;

			if ( emptyInit ) {
				options = {};
			}

			this.oApi = this.internal = _ext.internal;

			// Extend with old style plug-in API methods
			for ( var fn in DataTable.ext.internal ) {
				if ( fn ) {
					this[fn] = _fnExternApiFunc(fn);
				}
			}

			this.each(function() {
				var o = {};
				var oInit = len > 1 ? // optimisation for single table case
				_fnExtend( o, options, true ) :
				options;
				console.log(">>this");
				console.log(this);
				/*global oInit,_that,emptyInit*/
				var i=0, iLen, j, jLen, k, kLen;
				var sId = this.getAttribute( 'id' );
				var bInitHandedOff = false;
				var defaults = DataTable.defaults;
				console.log(">>defaults");
				console.log(defaults);
				var $this = $(this);
				console.log(">>$this");
				console.log($this);

			  	/* Sanity check */
				 if ( this.nodeName.toLowerCase() != 'table' )
				 {
				 	_fnLog( null, 0, 'Non-table node initialisation ('+this.nodeName+')', 2 );
				 	return;
				 }

				 /* Backwards compatibility for the defaults */
				 //_fnCompatOpts( defaults );
				 //_fnCompatCols( defaults.column );

				// /* Convert the camel-case defaults to Hungarian */
				//_fnCamelToHungarian( defaults, defaults, true );
				//_fnCamelToHungarian( defaults.column, defaults.column, true );

				 /* Check to see if we are re-initialising a table */
		 	 	var allSettings = DataTable.settings;
		 	 	console.log(">>allSettings");
		 	 	console.log(allSettings);

		 	 	/* Ensure the table has an ID - required for accessibility */
		 	 	if ( sId === null || sId === "" )
		 	 	{
		 	 		sId = "DataTables_Table_"+(DataTable.ext._unique++);
		 	 		this.id = sId;
		 	 	}

		 	 	/* Create the settings object for this table and set some of the default parameters */
		 	 	var oSettings = $.extend( true, {}, DataTable.models.oSettings, {
		 	 		"sDestroyWidth": $this[0].style.width,
		 	 		"sInstance":     sId,
		 	 		"sTableId":      sId
		 	 	} );

		 	 	oSettings.nTable = this;
		 	 	oSettings.oApi   = _that.internal;
		 	 	oSettings.oInit  = oInit;
		 		
		 	 	allSettings.push( oSettings );

		 	 	oSettings.oInstance = (_that.length===1) ? _that : $this.dataTable();

		 	 	//_fnCompatOpts( oInit );

		 	 	// if ( oInit.oLanguage )
		 	 	// {
		 	 	// 	_fnLanguageCompat( oInit.oLanguage );
		 	 	// }

		 	 	// If the length menu is given, but the init display length is not, use the length menu
		 	 	// if ( oInit.aLengthMenu && ! oInit.iDisplayLength )
		 	 	// {
		 	 	// 	oInit.iDisplayLength = $.isArray( oInit.aLengthMenu[0] ) ?
		 	 	// 		oInit.aLengthMenu[0][0] : oInit.aLengthMenu[0];
		 	 	// }

		 	 	console.log("oInit");
		 	 	console.log(oInit);
		 	 	oInit = _fnExtend( $.extend( true, {}, defaults ), oInit );
	 		  	// Map the initialisation options onto the settings object
	 		  	console.log(">>oSettings.oFeatures");
	 		  	console.log(oSettings.oFeatures);
	 		  	_fnMap( oSettings.oFeatures, oInit, [
	 		  		"bPaginate",
	 		  		"bLengthChange",
	 		  		"bFilter",
	 		  		"bSort",
	 		  		"bSortMulti",
	 		  		"bInfo",
	 		  		"bProcessing",
	 		  		"bAutoWidth",
	 		  		"bSortClasses",
	 		  		"bServerSide",
	 		  		"bDeferRender"
	 		  	] );

	 			_fnMap( oSettings, oInit, [
	 				"asStripeClasses",
	 				"ajax",
	 				"fnServerData",
	 				"fnFormatNumber",
	 				"sServerMethod",
	 				"aaSorting",
	 				"aaSortingFixed",
	 				"aLengthMenu",
	 				"sPaginationType",
	 				"sAjaxSource",
	 				"sAjaxDataProp",
	 				"iStateDuration",
	 				"sDom",
	 				"bSortCellsTop",
	 				"iTabIndex",
	 				"fnStateLoadCallback",
	 				"fnStateSaveCallback",
	 				"renderer",
	 				"searchDelay",
	 				[ "iCookieDuration", "iStateDuration" ], // backwards compat
	 				[ "oSearch", "oPreviousSearch" ],
	 				[ "aoSearchCols", "aoPreSearchCols" ],
	 				[ "iDisplayLength", "_iDisplayLength" ],
	 				[ "bJQueryUI", "bJUI" ]
	 			] );
	 			_fnMap( oSettings.oScroll, oInit, [
	 				[ "sScrollX", "sX" ],
	 				[ "sScrollXInner", "sXInner" ],
	 				[ "sScrollY", "sY" ],
	 				[ "bScrollCollapse", "bCollapse" ]
	 			] );
	 			_fnMap( oSettings.oLanguage, oInit, "fnInfoCallback" );

	 			/* Callback functions which are array driven */
	 			_fnCallbackReg( oSettings, 'aoDrawCallback',       oInit.fnDrawCallback,      'user' );
	 			_fnCallbackReg( oSettings, 'aoServerParams',       oInit.fnServerParams,      'user' );
	 			_fnCallbackReg( oSettings, 'aoStateSaveParams',    oInit.fnStateSaveParams,   'user' );
	 			_fnCallbackReg( oSettings, 'aoStateLoadParams',    oInit.fnStateLoadParams,   'user' );
	 			_fnCallbackReg( oSettings, 'aoStateLoaded',        oInit.fnStateLoaded,       'user' );
	 			_fnCallbackReg( oSettings, 'aoRowCallback',        oInit.fnRowCallback,       'user' );
	 			_fnCallbackReg( oSettings, 'aoRowCreatedCallback', oInit.fnCreatedRow,        'user' );
	 			_fnCallbackReg( oSettings, 'aoHeaderCallback',     oInit.fnHeaderCallback,    'user' );
	 			_fnCallbackReg( oSettings, 'aoFooterCallback',     oInit.fnFooterCallback,    'user' );
	 			_fnCallbackReg( oSettings, 'aoInitComplete',       oInit.fnInitComplete,      'user' );
	 			_fnCallbackReg( oSettings, 'aoPreDrawCallback',    oInit.fnPreDrawCallback,   'user' );

 			  	var oClasses = oSettings.oClasses;
 				
 			//  	// @todo Remove in 1.11
 			// 	if ( oInit.bJQueryUI )
 			// 	{
 			// 		$.extend( oClasses, DataTable.ext.oJUIClasses, oInit.oClasses );
 				
 			// 		if ( oInit.sDom === defaults.sDom && defaults.sDom === "lfrtip" )
 			// 		{
 			// 			/* Set the DOM to use a layout suitable for jQuery UI's theming */
 			// 			oSettings.sDom = '<"H"lfr>t<"F"ip>';
 			// 		}
 				
 			// 		if ( ! oSettings.renderer ) {
 			// 			oSettings.renderer = 'jqueryui';
 			// 		}
 			// 		else if ( $.isPlainObject( oSettings.renderer ) && ! oSettings.renderer.header ) {
 			// 			oSettings.renderer.header = 'jqueryui';
 			// 		}
 			// 	}
 			// 	else
 			// 	{
 			 		$.extend( oClasses, DataTable.ext.classes, oInit.oClasses );
 			// 	}

			  	$this.addClass( oClasses.sTable );

			  	console.log(">>oSettings");
			  	console.log(oSettings);
				
			  	/* Calculate the scroll bar width and cache it for use later on */
				 if ( oSettings.oScroll.sX !== "" || oSettings.oScroll.sY !== "" )
				 {
				 	oSettings.oScroll.iBarWidth = _fnScrollBarWidth();
				 }
				 if ( oSettings.oScroll.sX === true ) { // Easy initialisation of x-scrolling
				 	oSettings.oScroll.sX = '100%';
				 }
				
				console.log(">>oSettings.iInitDisplayStart");
				console.log(oSettings.iInitDisplayStart);

				console.log("oInit1");
				console.log(oInit);
				if ( oSettings.iInitDisplayStart === undefined )
				{
				 	/* Display start point, taking into account the save saving */
				 	oSettings.iInitDisplayStart = oInit.iDisplayStart;
				 	oSettings._iDisplayStart = oInit.iDisplayStart;
				}
				
				if ( oInit.iDeferLoading !== null )
				{
				 	oSettings.bDeferLoading = true;
				 	var tmp = $.isArray( oInit.iDeferLoading );
				 	oSettings._iRecordsDisplay = tmp ? oInit.iDeferLoading[0] : oInit.iDeferLoading;
				 	oSettings._iRecordsTotal = tmp ? oInit.iDeferLoading[1] : oInit.iDeferLoading;
				}

				 /* Language definitions */
				 var oLanguage = oSettings.oLanguage;
				 $.extend( true, oLanguage, oInit.oLanguage );
				
				// if ( oLanguage.sUrl !== "" )
				// {
				// 	$.ajax( {
				// 		dataType: 'json',
				// 		url: oLanguage.sUrl,
				// 		success: function ( json ) {
				// 			_fnLanguageCompat( json );
				// 			_fnCamelToHungarian( defaults.oLanguage, json );
				// 			$.extend( true, oLanguage, json );
				// 			_fnInitialise( oSettings );
				// 		},
				// 		error: function () {
				// 			// Error occurred loading language file, continue on as best we can
				// 			_fnInitialise( oSettings );
				// 		}
				// 	} );
				// 	bInitHandedOff = true;
				// }

				console.log(">>oInit.asStripeClasses");
				console.log(oInit.asStripeClasses);

				console.log(">>oClasses");
				console.log(oClasses);
				
				if ( oInit.asStripeClasses === null )
				 {
				 	oSettings.asStripeClasses =[
				 		oClasses.sStripeOdd,
				 		oClasses.sStripeEven
				 	];
				}

				 /* Remove row stripe classes if they are already on the table row */
				var stripeClasses = oSettings.asStripeClasses;
				console.log(">>$this");
				console.log($this);
				var rowOne = $this.children('tbody').find('tr').eq(0);
				console.log(">>rowOne");
				console.log(rowOne);

				if ( $.inArray( true, $.map( stripeClasses, function(el, i) {
				  	console.log("el="+el+" hasClass="+rowOne.hasClass(el));
				  	return rowOne.hasClass(el);
				} ) ) !== -1 ) {
				  	$('tbody tr', this).removeClass( stripeClasses.join(' ') );
				  	oSettings.asDestroyStripes = stripeClasses.slice();
				}

				console.log("oSettings.asDestroyStripes");
				console.log(oSettings.asDestroyStripes);

				var anThs = [];
				var aoColumnsInit;
				var nThead = this.getElementsByTagName('thead');
				console.log(">>nThead");
				console.log(nThead);
				if ( nThead.length !== 0 )
				{
				  	_fnDetectHeader( oSettings.aoHeader, nThead[0] );
				  	anThs = _fnGetUniqueThs( oSettings );
				}

				// /* If not given a column array, generate one with nulls */
				// if ( oInit.aoColumns === null )
				// {
				// 	aoColumnsInit = [];
				// 	for ( i=0, iLen=anThs.length ; i<iLen ; i++ )
				// 	{
				// 		aoColumnsInit.push( null );
				// 	}
				// }
				// else
				// {
				// 	aoColumnsInit = oInit.aoColumns;
				// }

			 // 	/* Add the columns */
				// for ( i=0, iLen=aoColumnsInit.length ; i<iLen ; i++ )
				// {
				// 	_fnAddColumn( oSettings, anThs ? anThs[i] : null );
				// }

				// /* Apply the column definitions */
				// _fnApplyColumnDefs( oSettings, oInit.aoColumnDefs, aoColumnsInit, function (iCol, oDef) {
				// 	_fnColumnOptions( oSettings, iCol, oDef );
				// } );

				// if ( rowOne.length ) {
				// 	var a = function ( cell, name ) {
				// 		return cell.getAttribute( 'data-'+name ) !== null ? name : null;
				// 	};
				
				// 	$.each( _fnGetRowElements( oSettings, rowOne[0] ).cells, function (i, cell) {
				// 		var col = oSettings.aoColumns[i];
				
				// 		if ( col.mData === i ) {
				// 			var sort = a( cell, 'sort' ) || a( cell, 'order' );
				// 			var filter = a( cell, 'filter' ) || a( cell, 'search' );
				
				// 			if ( sort !== null || filter !== null ) {
				// 				col.mData = {
				// 					_:      i+'.display',
				// 					sort:   sort !== null   ? i+'.@data-'+sort   : undefined,
				// 					type:   sort !== null   ? i+'.@data-'+sort   : undefined,
				// 					filter: filter !== null ? i+'.@data-'+filter : undefined
				// 				};
				
				// 				_fnColumnOptions( oSettings, i );
				// 			}
				// 		}
				// 	} );
				// }

				// var features = oSettings.oFeatures;
				
				// /* Must be done after everything which can be overridden by the state saving! */
				// if ( oInit.bStateSave )
				// {
				// 	features.bStateSave = true;
				// 	_fnLoadState( oSettings, oInit );
				// 	_fnCallbackReg( oSettings, 'aoDrawCallback', _fnSaveState, 'state_save' );
				// }

				// // If aaSorting is not defined, then we use the first indicator in asSorting
				// // in case that has been altered, so the default sort reflects that option
				// if ( oInit.aaSorting === undefined )
				// {
				// 	var sorting = oSettings.aaSorting;
				// 	for ( i=0, iLen=sorting.length ; i<iLen ; i++ )
				// 	{
				// 		sorting[i][1] = oSettings.aoColumns[ i ].asSorting[0];
				// 	}
				// }
				
			 // 	_fnSortingClasses( oSettings );

			 // 	if ( features.bSort )
			 // 	{
			 // 		_fnCallbackReg( oSettings, 'aoDrawCallback', function () {
			 // 			if ( oSettings.bSorted ) {
			 // 				var aSort = _fnSortFlatten( oSettings );
			 // 				var sortedColumns = {};
			 	
			 // 				$.each( aSort, function (i, val) {
			 // 					sortedColumns[ val.src ] = val.dir;
			 // 				} );
			 	
			 // 				_fnCallbackFire( oSettings, null, 'order', [oSettings, aSort, sortedColumns] );
			 // 				_fnSortAria( oSettings );
			 // 			}
			 // 		} );
			 // 	}
			 	
			 // 	_fnCallbackReg( oSettings, 'aoDrawCallback', function () {
			 // 		if ( oSettings.bSorted || _fnDataSource( oSettings ) === 'ssp' || features.bDeferRender ) {
			 // 			_fnSortingClasses( oSettings );
			 // 		}
			 // 	}, 'sc' );
			 	
			 // 	/* Browser support detection */
			 // 	_fnBrowserDetect( oSettings );
			 	
			 // 	// Work around for Webkit bug 83867 - store the caption-side before removing from doc
			 // 	var captions = $this.children('caption').each( function () {
			 // 		this._captionSide = $this.css('caption-side');
			 // 	} );
			 	
			 // 	var thead = $this.children('thead');
			 // 	if ( thead.length === 0 )
			 // 	{
			 // 		thead = $('<thead/>').appendTo(this);
			 // 	}
			 // 	oSettings.nTHead = thead[0];
			 	
			 // 	var tbody = $this.children('tbody');
			 // 	if ( tbody.length === 0 )
			 // 	{
			 // 		tbody = $('<tbody/>').appendTo(this);
			 // 	}
			 // 	oSettings.nTBody = tbody[0];
			 	
			 // 	var tfoot = $this.children('tfoot');
			 // 	if ( tfoot.length === 0 && captions.length > 0 && (oSettings.oScroll.sX !== "" || oSettings.oScroll.sY !== "") )
			 // 	{
			 // 		// If we are a scrolling table, and no footer has been given, then we need to create
			 // 		// a tfoot element for the caption element to be appended to
			 // 		tfoot = $('<tfoot/>').appendTo(this);
			 // 	}
			 	
			 // 	if ( tfoot.length === 0 || tfoot.children().length === 0 ) {
			 // 		$this.addClass( oClasses.sNoFooter );
			 // 	}
			 // 	else if ( tfoot.length > 0 ) {
			 // 		oSettings.nTFoot = tfoot[0];
			 // 		_fnDetectHeader( oSettings.aoFooter, oSettings.nTFoot );
			 // 	}
			 	
			 // 	/* Check if there is data passing into the constructor */
			 // 	if ( oInit.aaData )
			 // 	{
			 // 		for ( i=0 ; i<oInit.aaData.length ; i++ )
			 // 		{
			 // 			_fnAddData( oSettings, oInit.aaData[ i ] );
			 // 		}
			 // 	}
			 // 	else if ( oSettings.bDeferLoading || _fnDataSource( oSettings ) == 'dom' )
			 // 	{
			 // 		_fnAddTr( oSettings, $(oSettings.nTBody).children('tr') );
			 // 	}
			 	
			 // 	/* Copy the data index array */
			 // 	oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
			 	
			 // 	/* Initialisation complete - table can be drawn */
			 // 	oSettings.bInitialised = true;
			 	
			 	if ( bInitHandedOff === false )
			 	{
			 		//console.log(">>oSettings");
			 		//console.log(oSettings)
			 		//_fnInitialise( oSettings );
			 	}

			});

			return this;
		};

		function _fnInitialise ( settings )
		{
			var i, iLen, iAjaxStart=settings.iInitDisplayStart;
			var columns = settings.aoColumns, column;
			var features = settings.oFeatures;
		
			/* Ensure that the table data is fully initialised */
			if ( ! settings.bInitialised ) {
				setTimeout( function(){ _fnInitialise( settings ); }, 200 );
				return;
			}
		
			/* Show the display HTML options */
			 _fnAddOptionsHtml( settings );
		
			// /* Build and draw the header / footer for the table */
			 _fnBuildHead( settings );
			_fnDrawHead( settings, settings.aoHeader );
			_fnDrawHead( settings, settings.aoFooter );
		
			/* Okay to show that something is going on now */
			_fnProcessingDisplay( settings, true );
		
			/* Calculate sizes for columns */
			if ( features.bAutoWidth ) {
				_fnCalculateColumnWidths( settings );
			}
		
			for ( i=0, iLen=columns.length ; i<iLen ; i++ ) {
				column = columns[i];
		
				if ( column.sWidth ) {
					column.nTh.style.width = _fnStringToCss( column.sWidth );
				}
			}
		
			_fnReDraw( settings );
		
			// Server-side processing init complete is done by _fnAjaxUpdateDraw
			var dataSrc = _fnDataSource( settings );
			if ( dataSrc != 'ssp' ) {
				// if there is an ajax source load the data
				if ( dataSrc == 'ajax' ) {
					_fnBuildAjax( settings, [], function(json) {
						var aData = _fnAjaxDataSrc( settings, json );
		
						// Got the data - add it to the table
						for ( i=0 ; i<aData.length ; i++ ) {
							_fnAddData( settings, aData[i] );
						}
		
						// Reset the init display for cookie saving. We've already done
						// a filter, and therefore cleared it before. So we need to make
						// it appear 'fresh'
						settings.iInitDisplayStart = iAjaxStart;
		
						_fnReDraw( settings );
		
						_fnProcessingDisplay( settings, false );
						_fnInitComplete( settings, json );
					}, settings );
				}
				else {
					_fnProcessingDisplay( settings, false );
					_fnInitComplete( settings );
				}
			}
		}

		function _fnBuildHead( oSettings )
		{
			var i, ien, cell, row, column;
			var thead = oSettings.nTHead;
			var tfoot = oSettings.nTFoot;
			var createHeader = $('th, td', thead).length === 0;
			var classes = oSettings.oClasses;
			var columns = oSettings.aoColumns;
		
			if ( createHeader ) {
				row = $('<tr/>').appendTo( thead );
			}
		
			for ( i=0, ien=columns.length ; i<ien ; i++ ) {

				column = columns[i];
				cell = $( column.nTh ).addClass( column.sClass );
		
				if ( createHeader ) {
					cell.appendTo( row );
				}

				// 1.11 move into sorting
				if ( oSettings.oFeatures.bSort ) {
					cell.addClass( column.sSortingClass );
		
					if ( column.bSortable !== false ) {
						cell
							.attr( 'tabindex', oSettings.iTabIndex )
							.attr( 'aria-controls', oSettings.sTableId );
		
						_fnSortAttachListener( oSettings, column.nTh, i );
					}
				}
		
				if ( column.sTitle != cell.html() ) {
					cell.html( column.sTitle );
				}
				_fnRenderer( oSettings, 'header' )(
					oSettings, cell, column, classes
				);
			}
		
			if ( createHeader ) {
				_fnDetectHeader( oSettings.aoHeader, thead );
			}
			
			/* ARIA role for the rows */
		 	$(thead).find('>tr').attr('role', 'row');
		
			/* Deal with the footer - add classes if required */
			$(thead).find('>tr>th, >tr>td').addClass( classes.sHeaderTH );
			$(tfoot).find('>tr>th, >tr>td').addClass( classes.sFooterTH );

			
			if ( tfoot !== null ) {
				var cells = oSettings.aoFooter[0];
		
				for ( i=0, ien=cells.length ; i<ien ; i++ ) {
					column = columns[i];
					column.nTf = cells[i].cell;
		
					if ( column.sClass ) {
						$(column.nTf).addClass( column.sClass );
					}
				}
			}
		}

		function _fnAddOptionsHtml ( oSettings )
		{
			var classes = oSettings.oClasses;
			var table = $(oSettings.nTable);
			
			var holding = $('<div/>').insertBefore( table ); // Holding element for speed
			var features = oSettings.oFeatures;
		
			// All DataTables are wrapped in a div
			var insert = $('<div/>', {
				id:      oSettings.sTableId+'_wrapper',
				'class': classes.sWrapper + (oSettings.nTFoot ? '' : ' '+classes.sNoFooter)
			} );
		
			oSettings.nHolding = holding[0];
			oSettings.nTableWrapper = insert[0];
			oSettings.nTableReinsertBefore = oSettings.nTable.nextSibling;
		
			/* Loop over the user set positioning and place the elements as needed */
			var aDom = oSettings.sDom.split('');

			var featureNode, cOption, nNewNode, cNext, sAttr, j;
			for ( var i=0 ; i<aDom.length ; i++ )
			{
				featureNode = null;
				cOption = aDom[i];
		
				if ( cOption == '<' )
				{
					console.log("<");
					/* New container div */
					nNewNode = $('<div/>')[0];
		
					/* Check to see if we should append an id and/or a class name to the container */
					cNext = aDom[i+1];
					if ( cNext == "'" || cNext == '"' )
					{
						sAttr = "";
						j = 2;
						while ( aDom[i+j] != cNext )
						{
							sAttr += aDom[i+j];
							j++;
						}
		
						/* Replace jQuery UI constants @todo depreciated */
						if ( sAttr == "H" )
						{
							sAttr = classes.sJUIHeader;
						}
						else if ( sAttr == "F" )
						{
							sAttr = classes.sJUIFooter;
						}
		
						/* The attribute can be in the format of "#id.class", "#id" or "class" This logic
						 * breaks the string into parts and applies them as needed
						 */
						if ( sAttr.indexOf('.') != -1 )
						{
							var aSplit = sAttr.split('.');
							nNewNode.id = aSplit[0].substr(1, aSplit[0].length-1);
							nNewNode.className = aSplit[1];
						}
						else if ( sAttr.charAt(0) == "#" )
						{
							nNewNode.id = sAttr.substr(1, sAttr.length-1);
						}
						else
						{
							nNewNode.className = sAttr;
						}
		
						i += j; /* Move along the position array */
					}
		
					insert.append( nNewNode );
					insert = $(nNewNode);
				}
				else if ( cOption == '>' )
				{
					console.log(">cOption >");
					/* End container div */
					insert = insert.parent();
				}
				// @todo Move options into their own plugins?
				else if ( cOption == 'l' && features.bPaginate && features.bLengthChange )
				{
					console.log("cOption l");
					/* Length */
					featureNode = _fnFeatureHtmlLength( oSettings );
				}
				else if ( cOption == 'f' && features.bFilter )
				{
					console.log("cOption f");
					/* Filter */
					featureNode = _fnFeatureHtmlFilter( oSettings );
				}
				else if ( cOption == 'r' && features.bProcessing )
				{
					console.log("cOption r");
					/* pRocessing */
					featureNode = _fnFeatureHtmlProcessing( oSettings );
				}
				else if ( cOption == 't' )
				{
					console.log("cOption t");
					/* Table */
					featureNode = _fnFeatureHtmlTable( oSettings );
				}
				else if ( cOption ==  'i' && features.bInfo )
				{
					console.log("cOption i");
					/* Info */
					//featureNode = _fnFeatureHtmlInfo( oSettings );
				}
				else if ( cOption == 'p' && features.bPaginate )
				{
					console.log("cOption p");
					/* Pagination */
					featureNode = _fnFeatureHtmlPaginate( oSettings );
				}
				else if ( DataTable.ext.feature.length !== 0 )
				{
					console.log("other");
					/* Plug-in features */
					var aoFeatures = DataTable.ext.feature;
					for ( var k=0, kLen=aoFeatures.length ; k<kLen ; k++ )
					{
						if ( cOption == aoFeatures[k].cFeature )
						{
							featureNode = aoFeatures[k].fnInit( oSettings );
							break;
						}
					}
				}
		
				/* Add to the 2D features array */
				if ( featureNode )
				{
					var aanFeatures = oSettings.aanFeatures;
		
					if ( ! aanFeatures[cOption] )
					{
						aanFeatures[cOption] = [];
					}
		
					aanFeatures[cOption].push( featureNode );
					insert.append( featureNode );
				}
			}
		
			/* Built our DOM structure - replace the holding div with what we want */
			holding.replaceWith( insert );
		}

		function _fnRenderer( settings, type )
		{
			var renderer = settings.renderer;
			var host = DataTable.ext.renderer[type];
		
			if ( $.isPlainObject( renderer ) && renderer[type] ) {
				return host[renderer[type]] || host._;
			}
			else if ( typeof renderer === 'string' ) {
				return host[renderer] || host._;
			}
		
			// Use the default
			return host._;
		}

		function _fnDrawHead( oSettings, aoSource, bIncludeHidden )
		{
			var i, iLen, j, jLen, k, kLen, n, nLocalTr;
			var aoLocal = [];
			var aApplied = [];
			var iColumns = oSettings.aoColumns.length;
			var iRowspan, iColspan;
		
			if ( ! aoSource )
			{
				return;
			}
		
			if (  bIncludeHidden === undefined )
			{
				bIncludeHidden = false;
			}
		
			/* Make a copy of the master layout array, but without the visible columns in it */
			for ( i=0, iLen=aoSource.length ; i<iLen ; i++ )
			{
				aoLocal[i] = aoSource[i].slice();
				aoLocal[i].nTr = aoSource[i].nTr;
		
				/* Remove any columns which are currently hidden */
				for ( j=iColumns-1 ; j>=0 ; j-- )
				{
					if ( !oSettings.aoColumns[j].bVisible && !bIncludeHidden )
					{
						aoLocal[i].splice( j, 1 );
					}
				}
		
				/* Prep the applied array - it needs an element for each row */
				aApplied.push( [] );
			}
		
			for ( i=0, iLen=aoLocal.length ; i<iLen ; i++ )
			{
				nLocalTr = aoLocal[i].nTr;
		
				/* All cells are going to be replaced, so empty out the row */
				if ( nLocalTr )
				{
					while( (n = nLocalTr.firstChild) )
					{
						nLocalTr.removeChild( n );
					}
				}
		
				for ( j=0, jLen=aoLocal[i].length ; j<jLen ; j++ )
				{
					iRowspan = 1;
					iColspan = 1;
		
					/* Check to see if there is already a cell (row/colspan) covering our target
					 * insert point. If there is, then there is nothing to do.
					 */
					if ( aApplied[i][j] === undefined )
					{
						nLocalTr.appendChild( aoLocal[i][j].cell );
						aApplied[i][j] = 1;
		
						/* Expand the cell to cover as many rows as needed */
						while ( aoLocal[i+iRowspan] !== undefined &&
						        aoLocal[i][j].cell == aoLocal[i+iRowspan][j].cell )
						{
							aApplied[i+iRowspan][j] = 1;
							iRowspan++;
						}
		
						/* Expand the cell to cover as many columns as needed */
						while ( aoLocal[i][j+iColspan] !== undefined &&
						        aoLocal[i][j].cell == aoLocal[i][j+iColspan].cell )
						{
							/* Must update the applied array over the rows for the columns */
							for ( k=0 ; k<iRowspan ; k++ )
							{
								aApplied[i+k][j+iColspan] = 1;
							}
							iColspan++;
						}
		
						/* Do the actual expansion in the DOM */
						$(aoLocal[i][j].cell)
							.attr('rowspan', iRowspan)
							.attr('colspan', iColspan);
					}
				}
			}
		}

		var __re_html_remove = /<.*?>/g;
		function _fnCalculateColumnWidths ( oSettings )
		{
			var
				table = oSettings.nTable,
				columns = oSettings.aoColumns,
				scroll = oSettings.oScroll,
				scrollY = scroll.sY,
				scrollX = scroll.sX,
				scrollXInner = scroll.sXInner,
				columnCount = columns.length,
				visibleColumns = _fnGetColumns( oSettings, 'bVisible' ),
				headerCells = $('th', oSettings.nTHead),
				tableWidthAttr = table.getAttribute('width'), // from DOM element
				tableContainer = table.parentNode,
				userInputs = false,
				i, column, columnIdx, width, outerWidth;
		
			var styleWidth = table.style.width;
			if ( styleWidth && styleWidth.indexOf('%') !== -1 ) {
				tableWidthAttr = styleWidth;
			}
		
			/* Convert any user input sizes into pixel sizes */
			for ( i=0 ; i<visibleColumns.length ; i++ ) {
				column = columns[ visibleColumns[i] ];
		
				if ( column.sWidth !== null ) {
					column.sWidth = _fnConvertToWidth( column.sWidthOrig, tableContainer );
		
					userInputs = true;
				}
			}

			if ( ! userInputs && ! scrollX && ! scrollY &&
			    columnCount == _fnVisbleColumns( oSettings ) &&
				columnCount == headerCells.length
			) {
				for ( i=0 ; i<columnCount ; i++ ) {
					columns[i].sWidth = _fnStringToCss( headerCells.eq(i).width() );
				}
			}
			else
			{
				var tmpTable = $(table).clone() // don't use cloneNode - IE8 will remove events on the main table
					.empty()
					.css( 'visibility', 'hidden' )
					.removeAttr( 'id' )
					.append( $(oSettings.nTHead).clone( false ) )
					.append( $(oSettings.nTFoot).clone( false ) )
					.append( $('<tbody><tr/></tbody>') );
		
				// Remove any assigned widths from the footer (from scrolling)
				tmpTable.find('tfoot th, tfoot td').css('width', '');
		
				var tr = tmpTable.find( 'tbody tr' );
		
				// Apply custom sizing to the cloned header
				headerCells = _fnGetUniqueThs( oSettings, tmpTable.find('thead')[0] );
		
				for ( i=0 ; i<visibleColumns.length ; i++ ) {
					column = columns[ visibleColumns[i] ];
		
					headerCells[i].style.width = column.sWidthOrig !== null && column.sWidthOrig !== '' ?
						_fnStringToCss( column.sWidthOrig ) :
						'';
				}
		
				// Find the widest cell for each column and put it into the table
				if ( oSettings.aoData.length ) {
					for ( i=0 ; i<visibleColumns.length ; i++ ) {
						columnIdx = visibleColumns[i];
						column = columns[ columnIdx ];
		
						$( _fnGetWidestNode( oSettings, columnIdx ) )
							.clone( false )
							.append( column.sContentPadding )
							.appendTo( tr );
					}
				}
		
				// Table has been built, attach to the document so we can work with it
				tmpTable.appendTo( tableContainer );
		
				// When scrolling (X or Y) we want to set the width of the table as 
				// appropriate. However, when not scrolling leave the table width as it
				// is. This results in slightly different, but I think correct behaviour
				if ( scrollX && scrollXInner ) {
					tmpTable.width( scrollXInner );
				}
				else if ( scrollX ) {
					tmpTable.css( 'width', 'auto' );
		
					if ( tmpTable.width() < tableContainer.offsetWidth ) {
						tmpTable.width( tableContainer.offsetWidth );
					}
				}
				else if ( scrollY ) {
					tmpTable.width( tableContainer.offsetWidth );
				}
				else if ( tableWidthAttr ) {
					tmpTable.width( tableWidthAttr );
				}
		
				// Take into account the y scrollbar
				_fnScrollingWidthAdjust( oSettings, tmpTable[0] );
		
				if ( scrollX )
				{
					var total = 0;
		
					for ( i=0 ; i<visibleColumns.length ; i++ ) {
						column = columns[ visibleColumns[i] ];
						outerWidth = $(headerCells[i]).outerWidth();
		
						total += column.sWidthOrig === null ?
							outerWidth :
							parseInt( column.sWidth, 10 ) + outerWidth - $(headerCells[i]).width();
					}
		
					tmpTable.width( _fnStringToCss( total ) );
					table.style.width = _fnStringToCss( total );
				}
		
				// Get the width of each column in the constructed table
				for ( i=0 ; i<visibleColumns.length ; i++ ) {
					column = columns[ visibleColumns[i] ];
					width = $(headerCells[i]).width();
		
					if ( width ) {
						column.sWidth = _fnStringToCss( width );
					}
				}
		
				table.style.width = _fnStringToCss( tmpTable.css('width') );
		
				// Finished with the table - ditch it
				tmpTable.remove();
			}
		
			if ( tableWidthAttr ) {
				table.style.width = _fnStringToCss( tableWidthAttr );
			}
		
			if ( (tableWidthAttr || scrollX) && ! oSettings._reszEvt ) {
				$(window).bind('resize.DT-'+oSettings.sInstance, _fnThrottle( function () {
					_fnAdjustColumnSizing( oSettings );
				} ) );
		
				oSettings._reszEvt = true;
			}
		}

		function _fnProcessingDisplay ( settings, show )
		{
			if ( settings.oFeatures.bProcessing ) {
				$(settings.aanFeatures.r).css( 'display', show ? 'block' : 'none' );
			}
		
			_fnCallbackFire( settings, null, 'processing', [settings, show] );
		}

		function _fnCallbackReg( oSettings, sStore, fn, sName )
		{
			if ( fn )
			{
				oSettings[sStore].push( {
					"fn": fn,
					"sName": sName
				} );
			}
		}

		function _fnMap( ret, src, name, mappedName )
		{
			if ( $.isArray( name ) ) {
				$.each( name, function (i, val) {
					if ( $.isArray( val ) ) {
						_fnMap( ret, src, val[0], val[1] );
					}
					else {
						_fnMap( ret, src, val );
					}
				} );
		
				return;
			}
		
			if ( mappedName === undefined ) {
				mappedName = name;
			}
		
			if ( src[name] !== undefined ) {
				ret[mappedName] = src[name];
			}
		}

		function _fnLanguageCompat( lang )
		{
			var defaults = DataTable.defaults.oLanguage;
			var zeroRecords = lang.sZeroRecords;
		
			if ( ! lang.sEmptyTable && zeroRecords &&
				defaults.sEmptyTable === "No data available in table" )
			{
				_fnMap( lang, lang, 'sZeroRecords', 'sEmptyTable' );
			}
		
			/* Likewise with loading records */
			if ( ! lang.sLoadingRecords && zeroRecords &&
				defaults.sLoadingRecords === "Loading..." )
			{
				_fnMap( lang, lang, 'sZeroRecords', 'sLoadingRecords' );
			}
		
			// Old parameter name of the thousands separator mapped onto the new
			if ( lang.sInfoThousands ) {
				lang.sThousands = lang.sInfoThousands;
			}
		
			var decimal = lang.sDecimal;
			if ( decimal ) {
				_addNumericSort( decimal );
			}
		}

		function _addNumericSort ( decimalPlace ) {
			$.each(
				{
					// Plain numbers
					"num": function ( d ) {
						return __numericReplace( d, decimalPlace );
					},
		
					// Formatted numbers
					"num-fmt": function ( d ) {
						return __numericReplace( d, decimalPlace, _re_formatted_numeric );
					},
		
					// HTML numeric
					"html-num": function ( d ) {
						return __numericReplace( d, decimalPlace, _re_html );
					},
		
					// HTML numeric, formatted
					"html-num-fmt": function ( d ) {
						return __numericReplace( d, decimalPlace, _re_html, _re_formatted_numeric );
					}
				},
				function ( key, fn ) {
					// Add the ordering method
					_ext.type.order[ key+decimalPlace+'-pre' ] = fn;
		
					// For HTML types add a search formatter that will strip the HTML
					if ( key.match(/^html\-/) ) {
						_ext.type.search[ key+decimalPlace ] = _ext.type.search.html;
					}
				}
			);
		}


		function _fnEscapeRegex ( sVal )
		{
			return sVal.replace( _re_escape_regex, '\\$1' );
		}

		var __numericReplace = function ( d, decimalPlace, re1, re2 ) {
			if ( d !== 0 && (!d || d === '-') ) {
				return -Infinity;
			}
		
			if ( decimalPlace ) {
				d = _numToDecimal( d, decimalPlace );
			}
		
			if ( d.replace ) {
				if ( re1 ) {
					d = d.replace( re1, '' );
				}
		
				if ( re2 ) {
					d = d.replace( re2, '' );
				}
			}
		
			return d * 1;
		};

		var _numToDecimal = function ( num, decimalPoint ) {
			// Cache created regular expressions for speed as this function is called often
			if ( ! _re_dic[ decimalPoint ] ) {
				_re_dic[ decimalPoint ] = new RegExp( _fnEscapeRegex( decimalPoint ), 'g' );
			}
			return typeof num === 'string' && decimalPoint !== '.' ?
				num.replace( /\./g, '' ).replace( _re_dic[ decimalPoint ], '.' ) :
				num;
		};

		function _fnCompatCols ( init )
		{
			_fnCompatMap( init, 'orderable',     'bSortable' );
			_fnCompatMap( init, 'orderData',     'aDataSort' );
			_fnCompatMap( init, 'orderSequence', 'asSorting' );
			_fnCompatMap( init, 'orderDataType', 'sortDataType' );
		
			// orderData can be given as an integer
			var dataSort = init.aDataSort;
			if ( dataSort && ! $.isArray( dataSort ) ) {
				console.log("xxxxxx");
				init.aDataSort = [ dataSort ];
			}
		}

		function _fnCamelToHungarian ( src, user, force )
		{
			if ( ! src._hungarianMap ) {
				_fnHungarianMap( src );
			}
		
			var hungarianKey;
		
			$.each( user, function (key, val) {
				console.log("yyyyyyy");
				hungarianKey = src._hungarianMap[ key ];
		
				if ( hungarianKey !== undefined && (force || user[hungarianKey] === undefined) )
				{
					console.log("xxxxxxxxxxxxxxxxx");
					// For objects, we need to buzz down into the object to copy parameters
					if ( hungarianKey.charAt(0) === 'o' )
					{
						// Copy the camelCase options over to the hungarian
						if ( ! user[ hungarianKey ] ) {
							user[ hungarianKey ] = {};
						}
						$.extend( true, user[hungarianKey], user[key] );
		
						_fnCamelToHungarian( src[hungarianKey], user[hungarianKey], force );
					}
					else {
						console.log("hungarianKey="+hungarianKey);
						console.log("key="+key)
						user[hungarianKey] = user[ key ];
					}
				}
			} );
		}

		function _fnHungarianMap ( o )
		{
			var
				hungarian = 'a aa ai ao as b fn i m o s ',
				match,
				newKey,
				map = {};
		
			$.each( o, function (key, val) {
				match = key.match(/^([^A-Z]+?)([A-Z])/);
		
				if ( match && hungarian.indexOf(match[1]+' ') !== -1 )
				{
					newKey = key.replace( match[0], match[2].toLowerCase() );
					map[ newKey ] = key;
		
					if ( match[1] === 'o' )
					{
						_fnHungarianMap( o[key] );
					}
				}
			} );
		
			o._hungarianMap = map;
		}

		function _fnCompatOpts ( init )
		{
			_fnCompatMap( init, 'ordering',      'bSort' );
			_fnCompatMap( init, 'orderMulti',    'bSortMulti' );
			_fnCompatMap( init, 'orderClasses',  'bSortClasses' );
			_fnCompatMap( init, 'orderCellsTop', 'bSortCellsTop' );
			_fnCompatMap( init, 'order',         'aaSorting' );
			_fnCompatMap( init, 'orderFixed',    'aaSortingFixed' );
			_fnCompatMap( init, 'paging',        'bPaginate' );
			_fnCompatMap( init, 'pagingType',    'sPaginationType' );
			_fnCompatMap( init, 'pageLength',    'iDisplayLength' );
			_fnCompatMap( init, 'searching',     'bFilter' );
		
			var searchCols = init.aoSearchCols;
			if ( searchCols ) {
				console.log("xxxxx");
				for ( var i=0, ien=searchCols.length ; i<ien ; i++ ) {
					console.log("yyyyy");
					if ( searchCols[i] ) {
						_fnCamelToHungarian( DataTable.models.oSearch, searchCols[i] );
					}
				}
			}
		}

		function _fnCamelToHungarian ( src, user, force )
		{
			if ( ! src._hungarianMap ) {
				_fnHungarianMap( src );
			}
		
			var hungarianKey;
		
			$.each( user, function (key, val) {
				//console.log("key="+key +"  val="+val);
				hungarianKey = src._hungarianMap[ key ];
		
				if ( hungarianKey !== undefined && (force || user[hungarianKey] === undefined) )
				{
					// For objects, we need to buzz down into the object to copy parameters
					if ( hungarianKey.charAt(0) === 'o' )
					{
						// Copy the camelCase options over to the hungarian
						if ( ! user[ hungarianKey ] ) {
							user[ hungarianKey ] = {};
						}
						$.extend( true, user[hungarianKey], user[key] );
		
						_fnCamelToHungarian( src[hungarianKey], user[hungarianKey], force );
					}
					else {
						user[hungarianKey] = user[ key ];
					}
				}
			} );
		}

		var _fnCompatMap = function ( o, knew, old ) {
			if ( o[ knew ] !== undefined ) {
				console.log("ddddddd");
				o[ old ] = o[ knew ];
			}
		};

		function _fnLog( settings, level, msg, tn )
		{
			msg = 'DataTables warning: '+
				(settings!==null ? 'table id='+settings.sTableId+' - ' : '')+msg;
		
			if ( tn ) {
				msg += '. For more information about this error, please see '+
				'http://datatables.net/tn/'+tn;
			}
		
			if ( ! level  ) {
				// Backwards compatibility pre 1.10
				var ext = DataTable.ext;
				var type = ext.sErrMode || ext.errMode;
		
				_fnCallbackFire( settings, null, 'error', [ settings, tn, msg ] );
		
				if ( type == 'alert' ) {
					alert( msg );
				}
				else if ( type == 'throw' ) {
					throw new Error(msg);
				}
				else if ( typeof type == 'function' ) {
					type( settings, tn, msg );
				}
			}
			else if ( window.console && console.log ) {
				console.log( msg );
			}
		}

		function _fnCallbackFire( settings, callbackArr, e, args )
		{
			var ret = [];
		
			if ( callbackArr ) {
				ret = $.map( settings[callbackArr].slice().reverse(), function (val, i) {
					return val.fn.apply( settings.oInstance, args );
				} );
			}
		
			if ( e !== null ) {
				$(settings.nTable).trigger( e+'.dt', args );
			}
		
			return ret;
		}

		function _fnExtend( out, extender, breakRefs )
		{
			var val;
		
			for ( var prop in extender ) {
				if ( extender.hasOwnProperty(prop) ) {
					val = extender[prop];
		
					if ( $.isPlainObject( val ) ) {
						if ( ! $.isPlainObject( out[prop] ) ) {
							out[prop] = {};
						}
						$.extend( true, out[prop], val );
					}
					else if ( breakRefs && prop !== 'data' && prop !== 'aaData' && $.isArray(val) ) {
						out[prop] = val.slice();
					}
					else {
						out[prop] = val;
					}
				}
			}
		
			return out;
		}

		function _fnSettingsFromNode ( table ){
		 	var settings = DataTable.settings;
		 	var idx = $.inArray( table, _pluck( settings, 'nTable' ) );
		 	return idx !== -1 ? settings[ idx ] : null;
		}

		var _toSettings = function ( mixed )
		{
		 	var idx, jq;
		 	var settings = DataTable.settings;
		 	var tables = $.map( settings, function (el, i) {
		 		return el.nTable;
		 	} );

		 	if ( ! mixed ) {
		 		return [];
		 	}
		 	else if ( mixed.nTable && mixed.oApi ) {
		 		// DataTables settings object
		 		return [ mixed ];
		 	}
		 	else if ( mixed.nodeName && mixed.nodeName.toLowerCase() === 'table' ) {
		 		// Table node
		 		idx = $.inArray( mixed, tables );
		 		return idx !== -1 ? [ settings[idx] ] : null;
		 	}
		 	else if ( mixed && typeof mixed.settings === 'function' ) {
		 		return mixed.settings().toArray();
		 	}
		 	else if ( typeof mixed === 'string' ) {
		 		// jQuery selector
		 		jq = $(mixed);
		 	}
		 	else if ( mixed instanceof $ ) {
		 		// jQuery object (also DataTables instance)
		 		jq = mixed;
		 	}
		 
		 	if ( jq ) {
		 		return jq.map( function(i) {
		 			idx = $.inArray( this, tables );
		 			return idx !== -1 ? settings[idx] : null;
		 		} ).toArray();
		 	}
		 };

		_Api = function ( context, data ){
			if ( ! this instanceof _Api ) {
				throw 'DT API must be constructed as a new object';
				// or should it do the 'new' for the caller?
				// return new _Api.apply( this, arguments );
			}

			var settings = [];
			var ctxSettings = function ( o ) {
				var a = _toSettings( o );
				if ( a ) {
					settings.push.apply( settings, a );
				}
			};

			if ( $.isArray( context ) ) {
				for ( var i=0, ien=context.length ; i<ien ; i++ ) {
					ctxSettings( context[i] );
				}
			}
			else {
				ctxSettings( context );
			}

			// Remove duplicates
			this.context = _unique( settings );
			
			// Initial data
			if ( data ) {
				this.push.apply( this, data.toArray ? data.toArray() : data );
			}
			
			// selector
			this.selector = {
				rows: null,
				cols: null,
				opts: null
			};

			_Api.extend( this, this, __apiStruct );


		};

		var _pluck = function ( a, prop, prop2 ) {
			var out = [];
			var i=0, ien=a.length;

			if ( prop2 !== undefined ) {
				for ( ; i<ien ; i++ ) {
					if ( a[i] && a[i][ prop ] ) {
						out.push( a[i][ prop ][ prop2 ] );
					}
				}
			}
			else {
				for ( ; i<ien ; i++ ) {
					if ( a[i] ) {
						out.push( a[i][ prop ] );
					}
				}
			}

			return out;
		};

		var _range = function ( len, start )
		{
			var out = [];
			var end;
		
			if ( start === undefined ) {
				start = 0;
				end = len;
			}
			else {
				end = start;
				start = len;
			}
		
			for ( var i=start ; i<end ; i++ ) {
				out.push( i );
			}
		
			return out;
		};

		var _unique = function ( src )
		{
			var
				out = [],
				val,
				i, ien=src.length,
				j, k=0;
		
			again: for ( i=0 ; i<ien ; i++ ) {
				val = src[i];
		
				for ( j=0 ; j<k ; j++ ) {
					if ( out[j] === val ) {
						continue again;
					}
				}
		
				out.push( val );
				k++;
			}
		
			return out;
		};

		var __apiStruct = [];
		var __arrayProto = Array.prototype;
		DataTable.version = "1.10.6";
		DataTable.settings = [];

		DataTable.Api = _Api;
		_Api.prototype = /** @lends DataTables.Api */{
			concat:  __arrayProto.concat,
		
		
			context: [], // array of table settings objects
		
		
			each: function ( fn )
			{
				for ( var i=0, ien=this.length ; i<ien; i++ ) {
					fn.call( this, this[i], i, this );
				}
		
				return this;
			},
		
		
			eq: function ( idx )
			{
				var ctx = this.context;
		
				return ctx.length > idx ?
					new _Api( ctx[idx], this[idx] ) :
					null;
			},
		
		
			filter: function ( fn )
			{
				var a = [];
		
				if ( __arrayProto.filter ) {
					a = __arrayProto.filter.call( this, fn, this );
				}
				else {
					// Compatibility for browsers without EMCA-252-5 (JS 1.6)
					for ( var i=0, ien=this.length ; i<ien ; i++ ) {
						if ( fn.call( this, this[i], i, this ) ) {
							a.push( this[i] );
						}
					}
				}
		
				return new _Api( this.context, a );
			},
		
		
			flatten: function ()
			{
				var a = [];
				return new _Api( this.context, a.concat.apply( a, this.toArray() ) );
			},
		
		
			join:    __arrayProto.join,
		
		
			indexOf: __arrayProto.indexOf || function (obj, start)
			{
				for ( var i=(start || 0), ien=this.length ; i<ien ; i++ ) {
					if ( this[i] === obj ) {
						return i;
					}
				}
				return -1;
			},
		
			// Note that `alwaysNew` is internal - use iteratorNew externally
			iterator: function ( flatten, type, fn, alwaysNew ) {
				var
					a = [], ret,
					i, ien, j, jen,
					context = this.context,
					rows, items, item,
					selector = this.selector;
		
				// Argument shifting
				if ( typeof flatten === 'string' ) {
					alwaysNew = fn;
					fn = type;
					type = flatten;
					flatten = false;
				}
		
				for ( i=0, ien=context.length ; i<ien ; i++ ) {
					var apiInst = new _Api( context[i] );
		
					if ( type === 'table' ) {
						ret = fn.call( apiInst, context[i], i );
		
						if ( ret !== undefined ) {
							a.push( ret );
						}
					}
					else if ( type === 'columns' || type === 'rows' ) {
						// this has same length as context - one entry for each table
						ret = fn.call( apiInst, context[i], this[i], i );
		
						if ( ret !== undefined ) {
							a.push( ret );
						}
					}
					else if ( type === 'column' || type === 'column-rows' || type === 'row' || type === 'cell' ) {
						// columns and rows share the same structure.
						// 'this' is an array of column indexes for each context
						items = this[i];
		
						if ( type === 'column-rows' ) {
							rows = _selector_row_indexes( context[i], selector.opts );
						}
		
						for ( j=0, jen=items.length ; j<jen ; j++ ) {
							item = items[j];
		
							if ( type === 'cell' ) {
								ret = fn.call( apiInst, context[i], item.row, item.column, i, j );
							}
							else {
								ret = fn.call( apiInst, context[i], item, i, j, rows );
							}
		
							if ( ret !== undefined ) {
								a.push( ret );
							}
						}
					}
				}
		
				if ( a.length || alwaysNew ) {
					var api = new _Api( context, flatten ? a.concat.apply( [], a ) : a );
					var apiSelector = api.selector;
					apiSelector.rows = selector.rows;
					apiSelector.cols = selector.cols;
					apiSelector.opts = selector.opts;
					return api;
				}
				return this;
			},
		
		
			lastIndexOf: __arrayProto.lastIndexOf || function (obj, start)
			{
				// Bit cheeky...
				return this.indexOf.apply( this.toArray.reverse(), arguments );
			},
		
		
			length:  0,
		
		
			map: function ( fn )
			{
				var a = [];
		
				if ( __arrayProto.map ) {
					a = __arrayProto.map.call( this, fn, this );
				}
				else {
					// Compatibility for browsers without EMCA-252-5 (JS 1.6)
					for ( var i=0, ien=this.length ; i<ien ; i++ ) {
						a.push( fn.call( this, this[i], i ) );
					}
				}
		
				return new _Api( this.context, a );
			},
		
		
			pluck: function ( prop )
			{
				return this.map( function ( el ) {
					return el[ prop ];
				} );
			},
		
			pop:     __arrayProto.pop,
		
		
			push:    __arrayProto.push,
		
		
			// Does not return an API instance
			reduce: __arrayProto.reduce || function ( fn, init )
			{
				return _fnReduce( this, fn, init, 0, this.length, 1 );
			},
		
		
			reduceRight: __arrayProto.reduceRight || function ( fn, init )
			{
				return _fnReduce( this, fn, init, this.length-1, -1, -1 );
			},
		
		
			reverse: __arrayProto.reverse,
		
		
			// Object with rows, columns and opts
			selector: null,
		
		
			shift:   __arrayProto.shift,
		
		
			sort:    __arrayProto.sort, // ? name - order?
		
		
			splice:  __arrayProto.splice,
		
		
			toArray: function ()
			{
				return __arrayProto.slice.call( this );
			},
		
		
			to$: function ()
			{
				return $( this );
			},
		
		
			toJQuery: function ()
			{
				return $( this );
			},
		
		
			unique: function ()
			{
				return new _Api( this.context, _unique(this) );
			},
		
		
			unshift: __arrayProto.unshift
		};

		_Api.extend = function ( scope, obj, ext )
		{
			// Only extend API instances and static properties of the API
			if ( ! ext.length || ! obj || ( ! (obj instanceof _Api) && ! obj.__dt_wrapper ) ) {
				return;
			}
		
			var
				i, ien,
				j, jen,
				struct, inner,
				methodScoping = function ( scope, fn, struc ) {
					return function () {
						var ret = fn.apply( scope, arguments );
		
						// Method extension
						_Api.extend( ret, ret, struc.methodExt );
						return ret;
					};
				};
		
			for ( i=0, ien=ext.length ; i<ien ; i++ ) {
				struct = ext[i];
		
				// Value
				obj[ struct.name ] = typeof struct.val === 'function' ?
					methodScoping( scope, struct.val, struct ) :
					$.isPlainObject( struct.val ) ?
						{} :
						struct.val;
		
				obj[ struct.name ].__dt_wrapper = true;
		
				// Property extension
				_Api.extend( scope, obj[ struct.name ], struct.propExt );
			}
		};


		DataTable.models = {};
	
		DataTable.models.oSearch = {
			"bCaseInsensitive": true,
			"sSearch": "",
			"bRegex": false,
			"bSmart": true
		};
		
		DataTable.models.oRow = {
			"nTr": null,
			"anCells": null,
			"_aData": [],
			"_aSortData": null,
			"_aFilterData": null,
			"_sFilterRow": null,
			"_sRowStripe": "",
			"src": null
		};
		
		DataTable.models.oColumn = {
			"idx": null,
			"aDataSort": null,
			"asSorting": null,
			"bSearchable": null,
			"bSortable": null,
			"bVisible": null,
			"_sManualType": null,
			"_bAttrSrc": false,
			"fnCreatedCell": null,
			"fnGetData": null,
			"fnSetData": null,
			"mData": null,
			"mRender": null,
			"nTh": null,
			"nTf": null,
			"sClass": null,
			"sContentPadding": null,
			"sDefaultContent": null,
			"sName": null,
			"sSortDataType": 'std',
			"sSortingClass": null,
			"sSortingClassJUI": null,
			"sTitle": null,
			"sType": null,
			"sWidth": null,
			"sWidthOrig": null
		};

		DataTable.defaults = {
			"aaData": null,
			"aaSorting": [[0,'asc']],
			"aaSortingFixed": [],
			"ajax": null,
			"aLengthMenu": [ 10, 25, 50, 100 ],
			"aoColumns": null,
			"aoColumnDefs": null,
			"aoSearchCols": [],
			"asStripeClasses": null,
			"bAutoWidth": true,
			"bDeferRender": false,
			"bDestroy": false,
			"bFilter": true,
			"bInfo": true,
			"bJQueryUI": false,
			"bLengthChange": true,
			"bPaginate": true,
			"bProcessing": false,
			"bRetrieve": false,
			"bScrollCollapse": false,
			"bServerSide": false,
			"bSort": true,
			"bSortMulti": true,
			"bSortCellsTop": false,
			"bSortClasses": true,
			"bStateSave": false,
			"fnCreatedRow": null,
			"fnDrawCallback": null,
			"fnFooterCallback": null,
			"fnFormatNumber": function ( toFormat ) {
				return toFormat.toString().replace(
					/\B(?=(\d{3})+(?!\d))/g,
					this.oLanguage.sThousands
				);
			},
		
			"fnHeaderCallback": null,
			"fnInfoCallback": null,
			"fnInitComplete": null,
			"fnPreDrawCallback": null,
			"fnRowCallback": null,
			"fnServerData": null,
			"fnServerParams": null,
			"fnStateLoadCallback": function ( settings ) {
				try {
					return JSON.parse(
						(settings.iStateDuration === -1 ? sessionStorage : localStorage).getItem(
							'DataTables_'+settings.sInstance+'_'+location.pathname
						)
					);
				} catch (e) {}
			},
			"fnStateLoadParams": null,
			"fnStateLoaded": null,
			"fnStateSaveCallback": function ( settings, data ) {
				try {
					(settings.iStateDuration === -1 ? sessionStorage : localStorage).setItem(
						'DataTables_'+settings.sInstance+'_'+location.pathname,
						JSON.stringify( data )
					);
				} catch (e) {}
			},
			"fnStateSaveParams": null,
			"iStateDuration": 7200,
			"iDeferLoading": null,
			"iDisplayLength": 10,
			"iDisplayStart": 0,
			"iTabIndex": 0,
			"oClasses": {},
			"oLanguage": {
				"oAria": {
					"sSortAscending": ": activate to sort column ascending",
					"sSortDescending": ": activate to sort column descending"
				},

				"oPaginate": {
					"sFirst": "First",
					"sLast": "Last",
					"sNext": "Next",
					"sPrevious": "Previous"
				},
				"sEmptyTable": "No data available in table",
				"sInfo": "Showing _START_ to _END_ of _TOTAL_ entries",
				"sInfoEmpty": "Showing 0 to 0 of 0 entries",
				"sInfoFiltered": "(filtered from _MAX_ total entries)",
				"sInfoPostFix": "",
				"sDecimal": "",
				"sThousands": ",",
				"sLengthMenu": "Show _MENU_ entries",
				"sLoadingRecords": "Loading...",
				"sProcessing": "Processing...",
				"sSearch": "Search:",
				"sSearchPlaceholder": "",
				"sUrl": "",
				"sZeroRecords": "No matching records found"
			},
			"oSearch": $.extend( {}, DataTable.models.oSearch ),
			"sAjaxDataProp": "data",
			"sAjaxSource": null,
			"sDom": "lfrtip",
			"searchDelay": null,
			"sPaginationType": "simple_numbers",
			"sScrollX": "",
			"sScrollXInner": "",
			"sScrollY": "",
			"sServerMethod": "GET",
			"renderer": null
		};

		_fnHungarianMap( DataTable.defaults );

		DataTable.defaults.column = {
			"aDataSort": null,
			"iDataSort": -1,
			"asSorting": [ 'asc', 'desc' ],
			"bSearchable": true,
			"bSortable": true,
			"bVisible": true,
			"fnCreatedCell": null,
			"mData": null,
			"mRender": null,
			"sCellType": "td",
			"sClass": "",
			"sContentPadding": "",
			"sDefaultContent": null,
			"sName": "",
			"sSortDataType": "std",
			"sTitle": null,
			"sType": null,
			"sWidth": null
		};
		
		_fnHungarianMap( DataTable.defaults.column );

		DataTable.models.oSettings = {
			"oFeatures": {
				"bAutoWidth": null,
				"bDeferRender": null,
				"bFilter": null,
				"bInfo": null,
				"bLengthChange": null,
				"bPaginate": null,
				"bProcessing": null,
				"bServerSide": null,
				"bSort": null,
				"bSortMulti": null,
				"bSortClasses": null,
				"bStateSave": null
			},
		
			"oScroll": {
				"bCollapse": null,
				"iBarWidth": 0,
				"sX": null,
				"sXInner": null,
				"sY": null
			},
			"oLanguage": {
				"fnInfoCallback": null
			},
		
			"oBrowser": {
				"bScrollOversize": false,
				"bScrollbarLeft": false
			},
		
		
			"ajax": null,
			"aanFeatures": [],
			"aoData": [],
			"aiDisplay": [],
			"aiDisplayMaster": [],
			"aoColumns": [],
			"aoHeader": [],
			"aoFooter": [],
			"oPreviousSearch": {},
			"aoPreSearchCols": [],
			"aaSorting": null,
			"aaSortingFixed": [],
			"asStripeClasses": null,
			"asDestroyStripes": [],
			"sDestroyWidth": 0,
			"aoRowCallback": [],
			"aoHeaderCallback": [],
			"aoFooterCallback": [],
			"aoDrawCallback": [],
			"aoRowCreatedCallback": [],
			"aoPreDrawCallback": [],
			"aoInitComplete": [],
			"aoStateSaveParams": [],
			"aoStateLoadParams": [],
			"aoStateLoaded": [],
			"sTableId": "",
			"nTable": null,
			"nTHead": null,
			"nTFoot": null,
			"nTBody": null,
			"nTableWrapper": null,
			"bDeferLoading": false,
			"bInitialised": false,
			"aoOpenRows": [],
			"sDom": null,
			"searchDelay": null,
			"sPaginationType": "two_button",
			"iStateDuration": 0,
			"aoStateSave": [],
			"aoStateLoad": [],
			"oSavedState": null,
			"oLoadedState": null,
			"sAjaxSource": null,
			"sAjaxDataProp": null,
			"bAjaxDataGet": true,
			"jqXHR": null,
			"json": undefined,
			"oAjaxData": undefined,
			"fnServerData": null,
			"aoServerParams": [],
			"sServerMethod": null,
			"fnFormatNumber": null,
			"aLengthMenu": null,
			"iDraw": 0,
			"bDrawing": false,
			"iDrawError": -1,
			"_iDisplayLength": 10,
			"_iDisplayStart": 0,
			"_iRecordsTotal": 0,
			"_iRecordsDisplay": 0,
			"bJUI": null,
			"oClasses": {},
			"bFiltered": false,
			"bSorted": false,
			"bSortCellsTop": null,
			"oInit": null,
			"aoDestroyCallback": [],
			"fnRecordsTotal": function ()
			{
				return _fnDataSource( this ) == 'ssp' ?
					this._iRecordsTotal * 1 :
					this.aiDisplayMaster.length;
			},
		
			"fnRecordsDisplay": function ()
			{
				return _fnDataSource( this ) == 'ssp' ?
					this._iRecordsDisplay * 1 :
					this.aiDisplay.length;
			},
		
			"fnDisplayEnd": function ()
			{
				var
					len      = this._iDisplayLength,
					start    = this._iDisplayStart,
					calc     = start + len,
					records  = this.aiDisplay.length,
					features = this.oFeatures,
					paginate = features.bPaginate;
		
				if ( features.bServerSide ) {
					return paginate === false || len === -1 ?
						start + records :
						Math.min( start+len, this._iRecordsDisplay );
				}
				else {
					return ! paginate || calc>records || len===-1 ?
						records :
						calc;
				}
			},
		
			"oInstance": null,
			"sInstance": null,
			"iTabIndex": 0,
			"nScrollHead": null,
			"nScrollFoot": null,
			"aLastSort": [],
			"oPlugins": {}
		};

		DataTable.ext = _ext = {
			buttons: {},
			classes: {},
			errMode: "alert",
			feature: [],
			search: [],
			internal: {},
			legacy: {
				ajax: null
			},
			pager: {},
		
		
			renderer: {
				pageButton: {},
				header: {}
			},
			order: {},
			type: {
				detect: [],
				search: {},
				order: {}
			},
			_unique: 0,
			fnVersionCheck: DataTable.fnVersionCheck,
			iApiIndex: 0,
			oJUIClasses: {},
			sVersion: DataTable.version
		};
		
		$.extend( _ext, {
			afnFiltering: _ext.search,
			aTypes:       _ext.type.detect,
			ofnSearch:    _ext.type.search,
			oSort:        _ext.type.order,
			afnSortData:  _ext.order,
			aoFeatures:   _ext.feature,
			oApi:         _ext.internal,
			oStdClasses:  _ext.classes,
			oPagination:  _ext.pager
		} );
		
		
		$.extend( DataTable.ext.classes, {
			"sTable": "dataTable",
			"sNoFooter": "no-footer",
		
			/* Paging buttons */
			"sPageButton": "paginate_button",
			"sPageButtonActive": "current",
			"sPageButtonDisabled": "disabled",
		
			/* Striping classes */
			"sStripeOdd": "odd",
			"sStripeEven": "even",
		
			/* Empty row */
			"sRowEmpty": "dataTables_empty",
		
			/* Features */
			"sWrapper": "dataTables_wrapper",
			"sFilter": "dataTables_filter",
			"sInfo": "dataTables_info",
			"sPaging": "dataTables_paginate paging_", /* Note that the type is postfixed */
			"sLength": "dataTables_length",
			"sProcessing": "dataTables_processing",
		
			/* Sorting */
			"sSortAsc": "sorting_asc",
			"sSortDesc": "sorting_desc",
			"sSortable": "sorting", /* Sortable in both directions */
			"sSortableAsc": "sorting_asc_disabled",
			"sSortableDesc": "sorting_desc_disabled",
			"sSortableNone": "sorting_disabled",
			"sSortColumn": "sorting_", /* Note that an int is postfixed for the sorting order */
		
			/* Filtering */
			"sFilterInput": "",
		
			/* Page length */
			"sLengthSelect": "",
		
			/* Scrolling */
			"sScrollWrapper": "dataTables_scroll",
			"sScrollHead": "dataTables_scrollHead",
			"sScrollHeadInner": "dataTables_scrollHeadInner",
			"sScrollBody": "dataTables_scrollBody",
			"sScrollFoot": "dataTables_scrollFoot",
			"sScrollFootInner": "dataTables_scrollFootInner",
		
			/* Misc */
			"sHeaderTH": "",
			"sFooterTH": "",
		
			// Deprecated
			"sSortJUIAsc": "",
			"sSortJUIDesc": "",
			"sSortJUI": "",
			"sSortJUIAscAllowed": "",
			"sSortJUIDescAllowed": "",
			"sSortJUIWrapper": "",
			"sSortIcon": "",
			"sJUIHeader": "",
			"sJUIFooter": ""
		} );

		(function() {
		
		var _empty = '';
		_empty = '';
		
		var _stateDefault = _empty + 'ui-state-default';
		var _sortIcon     = _empty + 'css_right ui-icon ui-icon-';
		var _headerFooter = _empty + 'fg-toolbar ui-toolbar ui-widget-header ui-helper-clearfix';
		
		$.extend( DataTable.ext.oJUIClasses, DataTable.ext.classes, {
			/* Full numbers paging buttons */
			"sPageButton":         "fg-button ui-button "+_stateDefault,
			"sPageButtonActive":   "ui-state-disabled",
			"sPageButtonDisabled": "ui-state-disabled",
		
			/* Features */
			"sPaging": "dataTables_paginate fg-buttonset ui-buttonset fg-buttonset-multi "+
				"ui-buttonset-multi paging_", /* Note that the type is postfixed */
		
			/* Sorting */
			"sSortAsc":            _stateDefault+" sorting_asc",
			"sSortDesc":           _stateDefault+" sorting_desc",
			"sSortable":           _stateDefault+" sorting",
			"sSortableAsc":        _stateDefault+" sorting_asc_disabled",
			"sSortableDesc":       _stateDefault+" sorting_desc_disabled",
			"sSortableNone":       _stateDefault+" sorting_disabled",
			"sSortJUIAsc":         _sortIcon+"triangle-1-n",
			"sSortJUIDesc":        _sortIcon+"triangle-1-s",
			"sSortJUI":            _sortIcon+"carat-2-n-s",
			"sSortJUIAscAllowed":  _sortIcon+"carat-1-n",
			"sSortJUIDescAllowed": _sortIcon+"carat-1-s",
			"sSortJUIWrapper":     "DataTables_sort_wrapper",
			"sSortIcon":           "DataTables_sort_icon",
		
			/* Scrolling */
			"sScrollHead": "dataTables_scrollHead "+_stateDefault,
			"sScrollFoot": "dataTables_scrollFoot "+_stateDefault,
		
			/* Misc */
			"sHeaderTH":  _stateDefault,
			"sFooterTH":  _stateDefault,
			"sJUIHeader": _headerFooter+" ui-corner-tl ui-corner-tr",
			"sJUIFooter": _headerFooter+" ui-corner-bl ui-corner-br"
		} );
		
		}());

		var extPagination = DataTable.ext.pager;

		function _numbers ( page, pages ) {
			var
				numbers = [],
				buttons = extPagination.numbers_length,
				half = Math.floor( buttons / 2 ),
				i = 1;
		
			if ( pages <= buttons ) {
				numbers = _range( 0, pages );
			}
			else if ( page <= half ) {
				numbers = _range( 0, buttons-2 );
				numbers.push( 'ellipsis' );
				numbers.push( pages-1 );
			}
			else if ( page >= pages - 1 - half ) {
				numbers = _range( pages-(buttons-2), pages );
				numbers.splice( 0, 0, 'ellipsis' ); // no unshift in ie6
				numbers.splice( 0, 0, 0 );
			}
			else {
				numbers = _range( page-half+2, page+half-1 );
				numbers.push( 'ellipsis' );
				numbers.push( pages-1 );
				numbers.splice( 0, 0, 'ellipsis' );
				numbers.splice( 0, 0, 0 );
			}
		
			numbers.DT_el = 'span';
			return numbers;
		}

		//Default sort methods
		$.extend( _ext.type.order, {
			// Dates
			"date-pre": function ( d ) {
				return Date.parse( d ) || 0;
			},
		
			// html
			"html-pre": function ( a ) {
				return _empty(a) ?
					'' :
					a.replace ?
						a.replace( /<.*?>/g, "" ).toLowerCase() :
						a+'';
			},
		
			// string
			"string-pre": function ( a ) {
				// This is a little complex, but faster than always calling toString,
				// http://jsperf.com/tostring-v-check
				return _empty(a) ?
					'' :
					typeof a === 'string' ?
						a.toLowerCase() :
						! a.toString ?
							'' :
							a.toString();
			},
		
			// string-asc and -desc are retained only for compatibility with the old
			// sort methods
			"string-asc": function ( x, y ) {
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			},
		
			"string-desc": function ( x, y ) {
				return ((x < y) ? 1 : ((x > y) ? -1 : 0));
			}
		} );
		
		
		// Numeric sorting types - order doesn't matter here
		_addNumericSort( '' );
		
		
		$.extend( true, DataTable.ext.renderer, {
			header: {
				_: function ( settings, cell, column, classes ) {
					$(settings.nTable).on( 'order.dt.DT', function ( e, ctx, sorting, columns ) {
						if ( settings !== ctx ) { // need to check this this is the host
							return;               // table, not a nested one
						}
		
						var colIdx = column.idx;
		
						cell
							.removeClass(
								column.sSortingClass +' '+
								classes.sSortAsc +' '+
								classes.sSortDesc
							)
							.addClass( columns[ colIdx ] == 'asc' ?
								classes.sSortAsc : columns[ colIdx ] == 'desc' ?
									classes.sSortDesc :
									column.sSortingClass
							);
					} );
				},
		
				jqueryui: function ( settings, cell, column, classes ) {
					$('<div/>')
						.addClass( classes.sSortJUIWrapper )
						.append( cell.contents() )
						.append( $('<span/>')
							.addClass( classes.sSortIcon+' '+column.sSortingClassJUI )
						)
						.appendTo( cell );
		
					// Attach a sort listener to update on sort
					$(settings.nTable).on( 'order.dt.DT', function ( e, ctx, sorting, columns ) {
						if ( settings !== ctx ) {
							return;
						}
		
						var colIdx = column.idx;
		
						cell
							.removeClass( classes.sSortAsc +" "+classes.sSortDesc )
							.addClass( columns[ colIdx ] == 'asc' ?
								classes.sSortAsc : columns[ colIdx ] == 'desc' ?
									classes.sSortDesc :
									column.sSortingClass
							);
		
						cell
							.find( 'span.'+classes.sSortIcon )
							.removeClass(
								classes.sSortJUIAsc +" "+
								classes.sSortJUIDesc +" "+
								classes.sSortJUI +" "+
								classes.sSortJUIAscAllowed +" "+
								classes.sSortJUIDescAllowed
							)
							.addClass( columns[ colIdx ] == 'asc' ?
								classes.sSortJUIAsc : columns[ colIdx ] == 'desc' ?
									classes.sSortJUIDesc :
									column.sSortingClassJUI
							);
					} );
				}
			}
		} );

		$.extend( extPagination, {
			simple: function ( page, pages ) {
				return [ 'previous', 'next' ];
			},
		
			full: function ( page, pages ) {
				return [  'first', 'previous', 'next', 'last' ];
			},
		
			simple_numbers: function ( page, pages ) {
				return [ 'previous', _numbers(page, pages), 'next' ];
			},
		
			full_numbers: function ( page, pages ) {
				return [ 'first', 'previous', _numbers(page, pages), 'next', 'last' ];
			},
		
			// For testing and plug-ins to use
			_numbers: _numbers,
		
			// Number of number buttons (including ellipsis) to show. _Must be odd!_
			numbers_length: 7
		} );

		$.extend( true, DataTable.ext.renderer, {
			pageButton: {
				_: function ( settings, host, idx, buttons, page, pages ) {
					var classes = settings.oClasses;
					var lang = settings.oLanguage.oPaginate;
					var btnDisplay, btnClass, counter=0;
		
					var attach = function( container, buttons ) {
						var i, ien, node, button;
						var clickHandler = function ( e ) {
							_fnPageChange( settings, e.data.action, true );
						};
		
						for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
							button = buttons[i];
		
							if ( $.isArray( button ) ) {
								var inner = $( '<'+(button.DT_el || 'div')+'/>' )
									.appendTo( container );
								attach( inner, button );
							}
							else {
								btnDisplay = '';
								btnClass = '';
		
								switch ( button ) {
									case 'ellipsis':
										container.append('<span class="ellipsis">&#x2026;</span>');
										break;
		
									case 'first':
										btnDisplay = lang.sFirst;
										btnClass = button + (page > 0 ?
											'' : ' '+classes.sPageButtonDisabled);
										break;
		
									case 'previous':
										btnDisplay = lang.sPrevious;
										btnClass = button + (page > 0 ?
											'' : ' '+classes.sPageButtonDisabled);
										break;
		
									case 'next':
										btnDisplay = lang.sNext;
										btnClass = button + (page < pages-1 ?
											'' : ' '+classes.sPageButtonDisabled);
										break;
		
									case 'last':
										btnDisplay = lang.sLast;
										btnClass = button + (page < pages-1 ?
											'' : ' '+classes.sPageButtonDisabled);
										break;
		
									default:
										btnDisplay = button + 1;
										btnClass = page === button ?
											classes.sPageButtonActive : '';
										break;
								}
		
								if ( btnDisplay ) {
									node = $('<a>', {
											'class': classes.sPageButton+' '+btnClass,
											'aria-controls': settings.sTableId,
											'data-dt-idx': counter,
											'tabindex': settings.iTabIndex,
											'id': idx === 0 && typeof button === 'string' ?
												settings.sTableId +'_'+ button :
												null
										} )
										.html( btnDisplay )
										.appendTo( container );
		
									_fnBindAction(
										node, {action: button}, clickHandler
									);
		
									counter++;
								}
							}
						}
					};
		
					// IE9 throws an 'unknown error' if document.activeElement is used
					// inside an iframe or frame. Try / catch the error. Not good for
					// accessibility, but neither are frames.
					var activeEl;
		
					try {
						// Because this approach is destroying and recreating the paging
						// elements, focus is lost on the select button which is bad for
						// accessibility. So we want to restore focus once the draw has
						// completed
						activeEl = $(document.activeElement).data('dt-idx');
					}
					catch (e) {}
		
					attach( $(host).empty(), buttons );
		
					if ( activeEl ) {
						$(host).find( '[data-dt-idx='+activeEl+']' ).focus();
					}
				}
			}
		} );

		$.extend( DataTable.ext.internal, {
		// 	_fnExternApiFunc: _fnExternApiFunc,
		// 	_fnBuildAjax: _fnBuildAjax,
		// 	_fnAjaxUpdate: _fnAjaxUpdate,
		// 	_fnAjaxParameters: _fnAjaxParameters,
		// 	_fnAjaxUpdateDraw: _fnAjaxUpdateDraw,
		// 	_fnAjaxDataSrc: _fnAjaxDataSrc,
		 	_fnAddColumn: _fnAddColumn,
		 	_fnColumnOptions: _fnColumnOptions,
		 	_fnAdjustColumnSizing: _fnAdjustColumnSizing,
		 	_fnVisibleToColumnIndex: _fnVisibleToColumnIndex,
		 	_fnColumnIndexToVisible: _fnColumnIndexToVisible,
		 	_fnVisbleColumns: _fnVisbleColumns,
		 	_fnGetColumns: _fnGetColumns,
		 	_fnColumnTypes: _fnColumnTypes,
		 	_fnApplyColumnDefs: _fnApplyColumnDefs,
		 	_fnHungarianMap: _fnHungarianMap,
		 	_fnCamelToHungarian: _fnCamelToHungarian,
		 	_fnLanguageCompat: _fnLanguageCompat,
		 	_fnBrowserDetect: _fnBrowserDetect,
		 	_fnAddData: _fnAddData,
		 	_fnAddTr: _fnAddTr,
		// 	_fnNodeToDataIndex: _fnNodeToDataIndex,
		// 	_fnNodeToColumnIndex: _fnNodeToColumnIndex,
		 	_fnGetCellData: _fnGetCellData,
		 	_fnSetCellData: _fnSetCellData,
		 	_fnSplitObjNotation: _fnSplitObjNotation,
		 	_fnGetObjectDataFn: _fnGetObjectDataFn,
		 	_fnSetObjectDataFn: _fnSetObjectDataFn,
		 	_fnGetDataMaster: _fnGetDataMaster,
		// 	_fnClearTable: _fnClearTable,
		// 	_fnDeleteIndex: _fnDeleteIndex,
		// 	_fnInvalidate: _fnInvalidate,
		 	_fnGetRowElements: _fnGetRowElements,
		 	_fnCreateTr: _fnCreateTr,
		 	_fnBuildHead: _fnBuildHead,
		 	_fnDrawHead: _fnDrawHead,
		 	_fnDraw: _fnDraw,
		 	_fnReDraw: _fnReDraw,
		 	_fnAddOptionsHtml: _fnAddOptionsHtml,
		 	_fnDetectHeader: _fnDetectHeader,
		 	_fnGetUniqueThs: _fnGetUniqueThs,
		 	_fnFeatureHtmlFilter: _fnFeatureHtmlFilter,
		 	_fnFilterComplete: _fnFilterComplete,
		 	_fnFilterCustom: _fnFilterCustom,
		 	_fnFilterColumn: _fnFilterColumn,
		 	_fnFilter: _fnFilter,
		 	_fnFilterCreateSearch: _fnFilterCreateSearch,
		 	_fnEscapeRegex: _fnEscapeRegex,
		 	_fnFilterData: _fnFilterData,
		// 	_fnFeatureHtmlInfo: _fnFeatureHtmlInfo,
		// 	_fnUpdateInfo: _fnUpdateInfo,
		// 	_fnInfoMacros: _fnInfoMacros,
		 	_fnInitialise: _fnInitialise,
		 	_fnInitComplete: _fnInitComplete,
		 	_fnLengthChange: _fnLengthChange,
		 	_fnFeatureHtmlLength: _fnFeatureHtmlLength,
		 	_fnFeatureHtmlPaginate: _fnFeatureHtmlPaginate,
		 	_fnPageChange: _fnPageChange,
		// 	_fnFeatureHtmlProcessing: _fnFeatureHtmlProcessing,
		 	_fnProcessingDisplay: _fnProcessingDisplay,
		 	_fnFeatureHtmlTable: _fnFeatureHtmlTable,
		 	_fnScrollDraw: _fnScrollDraw,
		 	_fnApplyToChildren: _fnApplyToChildren,
		 	_fnCalculateColumnWidths: _fnCalculateColumnWidths,
		// 	_fnThrottle: _fnThrottle,
		// 	_fnConvertToWidth: _fnConvertToWidth,
		// 	_fnScrollingWidthAdjust: _fnScrollingWidthAdjust,
		// 	_fnGetWidestNode: _fnGetWidestNode,
		// 	_fnGetMaxLenString: _fnGetMaxLenString,
		 	_fnStringToCss: _fnStringToCss,
		// 	_fnScrollBarWidth: _fnScrollBarWidth,
		 	_fnSortFlatten: _fnSortFlatten,
		 	_fnSort: _fnSort,
		 	_fnSortAria: _fnSortAria,
		 	_fnSortListener: _fnSortListener,
		 	_fnSortAttachListener: _fnSortAttachListener,
		 	_fnSortingClasses: _fnSortingClasses,
		 	_fnSortData: _fnSortData,
		// 	_fnSaveState: _fnSaveState,
		 	_fnLoadState: _fnLoadState,
		// 	_fnSettingsFromNode: _fnSettingsFromNode,
		// 	_fnLog: _fnLog,
		 	_fnMap: _fnMap,
		 	_fnBindAction: _fnBindAction,
		 	_fnCallbackReg: _fnCallbackReg,
		 	_fnCallbackFire: _fnCallbackFire,
		 	_fnLengthOverflow: _fnLengthOverflow,
		 	_fnRenderer: _fnRenderer,
		 	_fnDataSource: _fnDataSource,
		 	_fnRowAttributes: _fnRowAttributes,
		// 	_fnCalculateEnd: function () {}
		} );


		function _fnExternApiFunc (fn)
		{
			return function() {
				var args = [_fnSettingsFromNode( this[DataTable.ext.iApiIndex] )].concat(
					Array.prototype.slice.call(arguments)
				);
				return DataTable.ext.internal[fn].apply( this, args );
			};
		}

		// jQuery access
		$.fn.dataTable = DataTable; 

		$.fn.DataTable = function ( opts ) {
			return $(this).dataTable( opts ).api();
		};

		return $.fn.dataTable;
	}));

}(window, document));