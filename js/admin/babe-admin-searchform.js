
(function( $ ) {
    
    ////////////////
    
    $(document).ready(function(){
        
        make_tabs_sortable();
        
        make_fields_sortable();

        // sanitise tab slug
        $('#search_form_tab_slug').on('change', function() {
            $('#search_form_tab_slug').val($('#search_form_tab_slug').val().replace(/[^a-z]/g,''));
        });

       //////////////add_search_tab//////////////////
       
       $('#search-form-tabs-new #add_search_tab').on( 'click', function(){
        
           var tab_category = {};
           
           $('#search_form_tabs_spinner').addClass('is-active');
           $('#search_form_tabs_spinner_done').removeClass('is-active');
           
           $("#search_form_tab_categoties input").each(function(ind, elm){
            
            if ( $(elm).attr('type') == 'checkbox' && $(elm).is(':checked') ){
                var arg_val = parseInt($(elm).val());
                tab_category[arg_val] = arg_val;
            }
           });
                       
           $.ajax({
		   url : babe_searchform_lst.ajax_url,
		   type : 'POST',
		   data : {
			action : 'search_form_add_tab',
            tab_title : $('#search_form_tab_title').val(),
            tab_slug : $('#search_form_tab_slug').val(),
            tab_category : tab_category,
            // check
	        nonce : babe_searchform_lst.nonce
		   },
		   success : function( msg ) {
		      
              $('#search_form_tabs_spinner').removeClass('is-active');
              $('#search_form_tabs_spinner_done').addClass('is-active');
              $('#search_form_tab_title').val('');
              $('#search_form_tab_slug').val('');
		      
              try {
			  var response = JSON.parse( msg );
		      } catch ( e ) {
			    return false;
		      }
		      
              $('#search-form-tabs').html(response.tabs);
              make_tabs_sortable();
              
              // update search form fields table
              if (response.fields != ''){
                $('#search-form-fields-table').html(response.fields);
                make_fields_sortable();
                update_fields();
              }
              
		   },
           error : function( jqXHR, exception ) {
            
              var msg = '';
        if (jqXHR.status === 0) {
            msg = 'Not connect.<br />Verify Network.';
        } else if (jqXHR.status == 404) {
            msg = 'Requested page not found. [404]';
        } else if (jqXHR.status == 500) {
            msg = 'Internal Server Error [500].';
        } else if (exception === 'parsererror') {
            msg = 'Requested JSON parse failed.';
        } else if (exception === 'timeout') {
            msg = 'Time out error.';
        } else if (exception === 'abort') {
            msg = 'Ajax request aborted.';
        } else {
            msg = 'Uncaught Error.\n' + jqXHR.responseText;
        }
            
              $('#search_form_tabs_spinner').removeClass('is-active');
              $('#search-form-tabs').html(msg);
              $('#search_form_tabs_spinner_done').addClass('is-active');
           }
          });
          
       });
       
       ///////////////////delete tab/////////////////////////////    

       $('#search-form-tabs').on('click', '.search_form_tab_item_del', function(event){
          //event.stopPropagation(); 
          var tab_slug = $(this).parent().data('tab-slug');
          
          babe_overlay_open();
                    
          $('#confirm_del_tab').on('click', '#delete', function(event){
           babe_overlay_close();
                       
           $('#search_form_tabs_spinner').addClass('is-active');
           $('#search_form_tabs_spinner_done').removeClass('is-active');
           
        $.ajax({
		url : babe_searchform_lst.ajax_url,
		type : 'POST',
		data : {
			action : 'search_form_delete_tab',
            tab_slug : tab_slug,
            // check
	        nonce : babe_searchform_lst.nonce
		},
		success : function( msg ) {
              $('#search_form_tabs_spinner').removeClass('is-active');
              $('#search_form_tabs_spinner_done').addClass('is-active');
		      
              try {
			  var response = JSON.parse( msg );
		      } catch ( e ) {
			    return false;
		      }
		      
              $('#search-form-tabs').html(response.tabs);
              make_tabs_sortable();
              
              // update search form fields table
              $('#search-form-fields-table').html(response.fields);
              make_fields_sortable();
                  
		},
        error : function( jqXHR, exception ) {
            
              $('#search_form_tabs_spinner').removeClass('is-active');
              $('#search_form_tabs_spinner_done').addClass('is-active');
           }
        });
       }); ///////  end click delete  
      });
      
      ////////////////////////////////
      
      $('#update_search_fields').on( 'click', function(){
         
         update_fields();
        
      });
    
    ////////////////////////////

});

/////////////////update_fields///////////////////////////////    

       function update_fields(){
        
        var fields_orders = {};
        var input_arr = {};
        var fields_icons = {};
        var fields_advanced = {};
        var show_price_slider = 0;
        var set_default_date_from = 0;
        var set_default_date_to_in_days = 0;

        var count = $('#search-form-fields-table tbody').children().length;
            
        if (count){
            var i = 1;
            $('#search-form-fields-table tbody').children().each(function(ind, elm){
                $(elm).attr('data-order', i);
                fields_orders[$(elm).data('field-slug')] = i;
                i++;
           });
        }

        if ( $('#show_price_slider').length > 0 ){
            show_price_slider = $("#show_price_slider").is(':checked') ? 1 : 0;
        }

        if ( $('#set_default_date_to_in_days').length > 0 ){
            set_default_date_to_in_days = $("#set_default_date_to_in_days").val();
        }

        if ( $('#set_default_date_from').length > 0 ){
            set_default_date_from = $("#set_default_date_from").is(':checked') ? 1 : 0;
        }

        $("#search-form-fields-table tbody .search-form-fields-row-title input").each(function(ind, elm){
            var field_slug = $(elm).data('field-slug');
            if ( $(elm).attr('type') == 'checkbox' ){
                fields_advanced[field_slug] = !$(elm).is(':checked') ? 0 : 1;
            } else {
                fields_icons[field_slug] = $(elm).val();
            }
        });
        
        $("#search-form-fields-table tbody .search-form-fields-row-value input").each(function(ind, elm){
            
            var tab_slug = $(elm).data('tab-slug');
            var field_slug = $(elm).data('field-slug');
            var field_arg = $(elm).data('field-arg');
            var arg_val = $(elm).val();
            
            if ( $(elm).attr('type') == 'checkbox' && !$(elm).is(':checked') ){
                arg_val = 0;
            }
            
            if (!input_arr.hasOwnProperty(tab_slug)) {
                input_arr[tab_slug] = {};
            }
            
            if (!input_arr[tab_slug].hasOwnProperty(field_slug)) {
                input_arr[tab_slug][field_slug] = {};
            }
            
            input_arr[tab_slug][field_slug][field_arg] = arg_val;
        });
        //////////////
        
        $('#search_form_fields_spinner').addClass('is-active');
        $('#search_form_fields_spinner_done').removeClass('is-active');
             
        $.ajax({
		url : babe_searchform_lst.ajax_url,
		type : 'POST',
		data : {
			action : 'search_form_update_fields',
            show_price_slider: show_price_slider,
            set_default_date_from: set_default_date_from,
            set_default_date_to_in_days: set_default_date_to_in_days,
            fields_advanced : fields_advanced,
            input_arr: input_arr,
            fields_orders: fields_orders,
            fields_icons: fields_icons,
            // check
	        nonce : babe_searchform_lst.nonce
		},
		success : function( msg ) {
		    
              $('#search_form_fields_spinner').removeClass('is-active');
              $('#search_form_fields_spinner_done').addClass('is-active');
		      
              // update search form fields table
              $('#search-form-fields-table').html(msg);
              make_fields_sortable();
                  
		  },
        error : function( jqXHR, exception ) {
              $('#search_form_fields_spinner').removeClass('is-active');
              $('#search_form_fields_spinner_done').addClass('is-active');
        }  
        });
        
    }

///////////make_tabs_sortable/////////////////
       
       function make_tabs_sortable(){
       
           $( '#search-form-tabs' ).sortable({
                axis: "y",
                placeholder: "ui-state-highlight",
                update: function( event, ui ) {
                   var count = $('#search-form-tabs').children().length;
                   if (count){
                    var i = 1;
                    var tab_orders = {};
                    $('#search-form-tabs').children().each(function(ind, elm){
                        $(elm).attr('data-order', i);
                        tab_orders[$(elm).data('tab-slug')] = i;
                        i++;
                    });
                    tabs_reorder(tab_orders);
                   }
                }
            });
       }

/////////////////tabs_reorder///////////////////////////////    

       function tabs_reorder(tab_orders){
        
          $('#search_form_tabs_spinner').addClass('is-active');
          $('#search_form_tabs_spinner_done').removeClass('is-active');
          
          $.ajax({
		   url : babe_searchform_lst.ajax_url,
		   type : 'POST',
		   data : {
			action : 'search_form_tabs_reorder',
            tab_orders : tab_orders,
            // check
	        nonce : babe_searchform_lst.nonce
		   },
		   success : function( msg ) {
              $('#search_form_tabs_spinner').removeClass('is-active');
              $('#search_form_tabs_spinner_done').addClass('is-active');
		      
              try {
			  var response = JSON.parse( msg );
		      } catch ( e ) {
			    return false;
		      }
		      
              $('#search-form-tabs').html(response.tabs);
              make_tabs_sortable();
              
              // update search form fields table
              $('#search-form-fields-table').html(response.fields);
              make_fields_sortable();
                
		   },
           error : function( jqXHR, exception ) {
              $('#search_form_tabs_spinner').removeClass('is-active');
              $('#search_form_tabs_spinner_done').addClass('is-active');
           }
          });
       }

///////////make_fields_sortable/////////////////
       
       function make_fields_sortable(){
       
           $( '#search-form-fields-table tbody' ).sortable({
                axis: "y",
                placeholder: "ui-state-highlight",
                update: function( event, ui ) {
                   var count = $('#search-form-fields-table tbody').children().length;
                   if (count){
                    var i = 1;
                    var fields_orders = {};
                    $('#search-form-fields-table tbody').children().each(function(ind, elm){
                        $(elm).attr('data-order', i);
                        fields_orders[$(elm).data('field-slug')] = i;
                        i++;
                    });
                    // fields_reorder(fields_orders);
                   }
                }
            });
       }       

})( jQuery );

