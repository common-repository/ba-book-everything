(function($){
	"use strict";

    const swal_config = {
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: babe_cmb2_lst.messages.ok,
        cancelButtonText: babe_cmb2_lst.messages.cancel,
        showClass: {
            popup: 'animate__animated animate__fadeIn animate__fast'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOut animate__faster'
        }
    };

    const Toast = Swal.mixin(swal_config);

////////////////////////////////////

$(document).ready(function(){
    
       add_datepicker('.av_dates input');
       
       add_datepicker('.date_input');
    
    ////////////////////////////////
       
    $('#start_date').datepicker({
        numberOfMonths: 1,
        dateFormat: babe_cmb2_lst.date_format,
        onSelect: function(dateText, inst) {
            //var start_date = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay)
            $( "#end_date" ).datepicker('option', 'minDate', dateText);
            $( "#end_date" ).datepicker('option', 'defaultDate', dateText);            
        }
    });
    
    add_datepicker('#end_date');
    
    ////////////////add_datepicker/////////////////
    function add_datepicker(id) {
      $( id ).datepicker({
	    numberOfMonths: 1,
        dateFormat: babe_cmb2_lst.date_format
      });
    }
    
    ////////////////select2///////////////////////
    
    $('.babe_cmb2_select_2').select2();
    
    $('.babe_cmb2_select_2_row select').select2();

    $('[name="billing_address[country]"]').select2();

    $('[name="billing_address[country]"]').on('select2:select', function (e) {
        let country = $(this).val();
        let newOptions = '<option value>' + babe_cmb2_lst.select2select + '</option>';
        let prop_disabled = false;

        $('[name="billing_address[state]"]').val('');

        if ( babe_cmb2_lst.states.hasOwnProperty(country) && babe_cmb2_lst.states[country].length !== 0 ){
            let select2_state_data = babe_cmb2_lst.states[country];
            for(let id in select2_state_data) {
                newOptions += '<option value="'+ id +'">'+ select2_state_data[id] +'</option>';
            }
        } else {
            newOptions = '<option value>---</option>';
            prop_disabled = true;
        }

        $('[name="billing_address[state]"]').select2('destroy').html(newOptions).prop("disabled", prop_disabled).select2();
    });

    $('[name="billing_address[state]"]').select2();

    /////////////////////////

    $('.pw_select2').each(function () {
        $(this).select2({
            allowClear: true
        });
    });

    ////// select2 in cmb-repeatable-group /////////

    // Before a new group row is added, destroy Select2. We'll reinitialise after the row is added
    $('.cmb-repeatable-group').on('cmb2_add_group_row_start', function (event, instance) {
        var $table = $(document.getElementById($(instance).data('selector')));
        var $oldRow = $table.find('.cmb-repeatable-grouping').last();
        $oldRow.find('.pw_select2').each(function () {
            $(this).select2('destroy');
        });
    });

    // When a new group row is added, clear selection and initialise Select2
    $('.cmb-repeatable-group').on('cmb2_add_row', function (event, newRow) {
        $(newRow).find('.pw_select').each(function () {
            $('option:selected', this).removeAttr("selected");
            $(this).select2({
                allowClear: true
            });
        });
        $(newRow).find('.pw_multiselect').each(function () {
            $('option:selected', this).removeAttr("selected");
            $(this).select2_sortable();
        });
        // Reinitialise the field we previously destroyed
        $(newRow).prev().find('.pw_select').each(function () {
            $(this).select2({
                allowClear: true
            });
        });
        // Reinitialise the field we previously destroyed
        $(newRow).prev().find('.pw_multiselect').each(function () {
            $(this).select2_sortable();
        });
    });

    // Before a group row is shifted, destroy Select2. We'll reinitialise after the row shift
    $('.cmb-repeatable-group').on('cmb2_shift_rows_start', function (event, instance) {
        var groupWrap = $(instance).closest('.cmb-repeatable-group');
        groupWrap.find('.pw_select2').each(function () {
            $(this).select2('destroy');
        });
    });

    // When a group row is shifted, reinitialise Select2
    $('.cmb-repeatable-group').on('cmb2_shift_rows_complete', function (event, instance) {
        var groupWrap = $(instance).closest('.cmb-repeatable-group');
        groupWrap.find('.pw_select').each(function () {
            $(this).select2({
                allowClear: true
            });
        });
        groupWrap.find('.pw_multiselect').each(function () {
            $(this).select2_sortable();
        });
    });

    // Before a new repeatable field row is added, destroy Select2. We'll reinitialise after the row is added
    $('.cmb-add-row-button').on('click', function (event) {
        var $table = $(document.getElementById($(event.target).data('selector')));
        var $oldRow = $table.find('.cmb-row').last();
        $oldRow.find('.pw_select2').each(function () {
            $(this).select2('destroy');
        });
    });

    // When a new repeatable field row is added, clear selection and initialise Select2
    $('.cmb-repeat-table').on('cmb2_add_row', function (event, newRow) {
        // Reinitialise the field we previously destroyed
        $(newRow).prev().find('.pw_select').each(function () {
            $('option:selected', this).removeAttr("selected");
            $(this).select2({
                allowClear: true
            });
        });
        // Reinitialise the field we previously destroyed
        $(newRow).prev().find('.pw_multiselect').each(function () {
            $('option:selected', this).removeAttr("selected");
            $(this).select2_sortable();
        });
    });
    
    /////////////////add time/////////////////////
    
    schedule_block_visibility_update();
    
    $('#categories').on('change', function(ev){
        schedule_block_visibility_update();
    });
    
    function schedule_block_visibility_update(){
        
        var cat = $('#categories').val();
        
        if ( $('input[name="schedule_conditions_' + cat + '"]').length > 0 ){
            $('.cmb2-id-schedule-group').css('display', 'block');
        } else {
            $('.cmb2-id-schedule-group').css('display', 'none');
        }
        
    }
    
    $('#schedule_block').on('click', '#add_schedule', function(el){
        el.stopPropagation();
        el.preventDefault();
        var day_num = $('#schedule_form_day').val(),
            hour = parseInt($('#schedule_form_hour').val()),
            minute = parseInt($('#schedule_form_minute').val()),
        sf = '';

        minute = (minute<10)?"0"+minute:minute;

        if ( $('#schedule_form_hour option[value="0"]').html().indexOf('am') !== -1 ){
            sf = $('#schedule_form_hour option[value="'+hour+'"]').html().indexOf('am') !== -1 ? 'am' : 'pm';
            sf = ' ' + sf;
            if ( hour === 0 ){
                hour = 12;
            } else if ( hour > 12 ){
                hour = hour - 12;
            }
        } else {
            hour = (hour<10)?"0"+hour:hour;
        }
            
        var time = hour+':'+minute + sf;
        $('#schedule_block .schedule_day[data-day-num="'+day_num+'"]').append('<span class="schedule_time">'+time+'<input type="hidden" class="schedule_time_'+day_num+'" name="_schedule_'+day_num+'[]" value="'+time+'"><i class="fa fa-times"></i></span>');
    });
    
    ////////////////delete time/////////////////
    $('#schedule_block').on('click', '.schedule_time i, .schedule_time svg', function(el){
        el.stopPropagation();
        el.preventDefault();
        $(this).parent().remove();
    });
    
    ///////////////save schedule//////////////////
    $('#schedule_block').on('click', '#save_schedule', function(el){
        el.stopPropagation();
        el.preventDefault();
        save_schedule();
    });
    
    //////////////////////////
    
    function save_schedule(){
        
        var obj_id = $('#schedule_block').data('obj-id'),
            start_date = $('#start_date').val(),
            end_date = $('#end_date').val(),
            cyclic_start_every = $('#cyclic_start_every').val(),
            cyclic_av = $('#cyclic_av').val();
            
        var schedule = {};    
            
        $(".schedule_details .schedule_day").each(function(){
            var day_num = $(this).data('day-num');
            schedule[day_num] = $(this).find('.schedule_time input').map(function(){return $(this).val();}).get();
        });
                       
        $('#save_schedule_spinner').html('<span class="spin_f"><i class="fas fa-spinner fa-spin fa-2x"></i></span>');      
        $.ajax({
		url : babe_cmb2_lst.ajax_url,
		type : 'POST',
		data : {
			action : 'save_schedule',
            obj_id : obj_id,
            start_date : start_date,
            end_date: end_date,
            cyclic_start_every: cyclic_start_every,
            cyclic_av: cyclic_av,
            schedule: schedule,
            // check
	        nonce : babe_cmb2_lst.nonce
		},
		success : function( msg ) {
		  $('#save_schedule_spinner').html('');
            ///////////////    
		  }
        });
    }

    $('#category_exclude_dates_add').on('click', function(ev){
        ev.preventDefault();

        let category_id = $(this).data('category-id'),
            start_date = $('#start_date').val(),
            end_date = $('#end_date').val();

        if ( start_date === '' || start_date === undefined || end_date === '' || end_date === undefined ){
            return;
        }

        $('#save_category_exclude_dates_spinner').html('<span class="spin_f"><i class="fas fa-spinner fa-spin fa-2x"></i></span>');
        $.ajax({
            url : babe_cmb2_lst.ajax_url,
            type : 'POST',
            data : {
                action : 'add_category_exclude_dates',
                category_id : category_id,
                start_date : start_date,
                end_date: end_date,
                // check
                nonce : babe_cmb2_lst.nonce
            },
            success : function( msg ) {

                if ( msg === '' ){
                    swal_error_general();
                    return;
                }

                $('#category_exclude_dates_tbody').html( msg );
                $('#start_date, #end_date').val('');
                swal_success();
            },
            error : function(){
                swal_error_general();
            }
        }).always( function(){
            $('#save_category_exclude_dates_spinner').html('');
        });
    });

    $('#category_exclude_dates_tbody').on('click', '.category_exclude_dates_del',function(ev){
        ev.stopPropagation();
        let category_exclude_dates_id = $(this).data('id');

        Toast.fire({
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: babe_cmb2_lst.messages.delete,
            title: babe_cmb2_lst.messages.are_you_sure
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url : babe_cmb2_lst.ajax_url,
                    type : 'POST',
                    data : {
                        action : 'delete_category_exclude_dates',
                        category_exclude_dates_id : category_exclude_dates_id,
                        category_id : $('#category_exclude_dates_add').data('category-id'),
                        // check
                        nonce : babe_cmb2_lst.nonce
                    },
                    success: function( msg ) {
                        $('#category_exclude_dates_tbody').html( msg );
                        swal_success();
                    },
                    error : function(){
                        swal_error_general();
                    }
                });
            }
        });
    });
    
    ///////////////////////////////////////////

    $('#recalculate_rating').on('click', function(el){
        el.stopPropagation();
        el.preventDefault();

        $('#recalculate_rating_spinner').html('<span class="spin_f"><i class="fas fa-spinner fa-spin fa-2x"></i></span>');

        let post_id = $(this).data('obj-id');

        $.ajax({
            url : babe_cmb2_lst.ajax_url,
            type : 'POST',
            data : {
                action : 'recalculate_rating',
                post_id : post_id,
                // check
                nonce : babe_cmb2_lst.nonce
            },
            success : function( msg ) {

                if ( msg === '' ){
                    swal_error_general();
                    return;
                }
                swal_success();
            },
            error : function(){
                swal_error_general();
            }
        }).always( function(){
            $('#recalculate_rating_spinner').html('');
        });
    });

    ///////////////////////////////////////////

    $('#get_the_rest_amount').on('click', function(el){
        $('#_prepaid_amount').val( $('#_total_amount').val() - $('#_prepaid_received').val() );
    });

    ///////////////////////////////////////////

    $('#coupon_generate_num').on('click', function(el){

        generate_coupon_number('#_coupon_number', '#coupon_generate_num_loader', true);

    });

    //////////////generate_coupon_number////////////
    
    function generate_coupon_number(selector_name, selector_spinner_name, is_val){
        
        $(selector_spinner_name).html('<span class="spin_f"><i class="fas fa-spinner fa-spin fa-2x"></i></span>');
        
        $.ajax({
		url : babe_cmb2_lst.ajax_url,
		type : 'POST',
		data : {
			action : 'generate_coupon_number',
            // check
	        nonce : babe_cmb2_lst.nonce
		},
		success : function( msg ) {
		    if (is_val){
		       $(selector_name).val(msg);
		    } else {
		       $(selector_name).html(msg);
		    }
            $(selector_spinner_name).html('');
		  },
        error: function(){
            $(selector_spinner_name).html('');
        }  
        });    
            
    }
    
    //////////////////Google API///
    
    var inited = {};

    ////////workaround enter press on autocomplete selector////////
    $(function(){
 var keyStop = {
  // 8: ":not(input:text, textarea, input:file, input:password)", // stop backspace = back
   13: "input:text, input:password", // stop enter = submit 
   end: null
 };
 $(document).bind("keydown", function(event){
  var selector = keyStop[event.which];

  if(selector !== undefined && $(event.target).is(selector)) {
      event.preventDefault(); //stop event
     // event.stopPropagation();
  }
  return true;
 });
});
    ///////////////////
    
    $('.cmb2-metabox').on('click', '.get_from_google', function(el){
        el.stopPropagation();
        el.preventDefault();
        var address_block = $(this).parents().eq(1);
        var google_map_get = $(address_block).find('.google_map_get').first();
        
        //$(address_block).find('.address_address input').first().attr('id');
        
        var address_field_id = $(address_block).find('.address_address input').first().attr('id'),
            latitude_field_id = $(address_block).find('.address_latitude input').first().attr('id'),
            longitude_field_id = $(address_block).find('.address_longitude input').first().attr('id');
            
        $(google_map_get).css('display', 'block');    
        
        var map_div = $(address_block).find('.google_map').first();
        var autocomplete = $(address_block).find('.autocomplete').first();
        var button_save = $(address_block).find('.save_from_google').first();
        
        if(inited[address_field_id] !== 1){
          init_map(map_div, google_map_get, autocomplete, button_save, address_field_id, latitude_field_id, longitude_field_id);
          inited[address_field_id] = 1;
        }  
    });
    
    /////////////init_map////////////////
    
    async function init_map(map_div, google_map_get, autocomplete_selector, button_save, address_field_id, latitude_field_id, longitude_field_id){
        
        var dom_obj = $(map_div)[0];

        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
        
        var map = new Map(dom_obj, {
          center: {lat: parseFloat(babe_cmb2_lst.start_lat), lng: parseFloat(babe_cmb2_lst.start_lng)},
          mapTypeControl: false,
          panControl: false,
          streetViewControl: false,
          zoom: parseInt(babe_cmb2_lst.start_zoom),
            mapId: 'DEMO_MAP_ID',
        });
        
        var input = $(autocomplete_selector)[0];

        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push($(button_save)[0]);

        var autocomplete = new google.maps.places.Autocomplete(input, {
              types: []
            });
        autocomplete.bindTo('bounds', map);

        var infowindow = new google.maps.InfoWindow();

        var marker = new AdvancedMarkerElement({
          map: map,
        });
        
        var selected_address = '';
        var selected_lat, selected_lng;

        autocomplete.addListener('place_changed', function() {
          infowindow.close();
          var place = autocomplete.getPlace();
          
          // If the place has a geometry, then present it on a map.
          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);  // Why 17? Because it looks good.
          }
          
          selected_lat = place.geometry.location.lat();
          selected_lng = place.geometry.location.lng();

          marker.position = place.geometry.location;

          var address = '';
          if (place.address_components) {
            address = [
              (place.address_components[0] && place.address_components[0].short_name || ''),
              (place.address_components[1] && place.address_components[1].short_name || ''),
              (place.address_components[2] && place.address_components[2].short_name || ''),
              (place.address_components[4] && place.address_components[4].short_name || ''),
              (place.address_components[6] && place.address_components[6].long_name || '')
            ].join(', ');
            selected_address = $(autocomplete_selector).val();
          }

          infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
          infowindow.open(map, marker);
        });
        
          $(button_save).on('click', function(el){
             el.stopPropagation();
             el.preventDefault();
             $('#'+address_field_id).val(selected_address);
             $('#'+latitude_field_id).val(selected_lat);
             $('#'+longitude_field_id).val(selected_lng);
             $(google_map_get).css('display', 'none');
          });
    }
    
    ///////////////////////////////
    
    $( '.cmb2-wrap > .cmb2-metabox' ).on( 'cmb2_add_row', function( evt, row ) {
			$( '.google_map_get', row ).css('display', 'none');
            $('.babe_cmb2_select_2').select2();
            
            $( '.av_dates input', row ).each(function(el){
                
                add_datepicker(this);
                
            });
            //add_datepicker('.av_dates input');
		});
        
    $('.cmb2-wrap').on('cmb2_add_group_row_start', function( evt, row ) {
			$('.babe_cmb2_select_2').select2('destroy');
		});
    
    /////////////////////////////////
    ////////////Settings tabs///////
    
    $('.babe-settings-wrap').on('click', '.nav-tab', function(event){
        
        event.preventDefault();
        
        var targ = $(this).data('target');
        
        $('.nav-tab').removeClass('nav-tab-active');
        $('.tab-target').removeClass('tab-target-active');
        $(this).addClass('nav-tab-active');
        $('#'+targ).addClass('tab-target-active');
        
        var ref = $('.babe-settings-wrap input[name="_wp_http_referer"]').val();
        var new_ref = ref;
        
        var query_string = {};
        
        var url_vars = ref.split("?");
        
        if (url_vars.length > 1){
            
            new_ref = url_vars[0] + '?';
            var url_pairs = url_vars[1].split("&");
            for (var i=0;i<url_pairs.length;i++){
                
                var pair = url_pairs[i].split("=");
                
                if (pair[0] != 'setting_tab'){
                    new_ref = new_ref + url_pairs[i] + '&';
                } 
            }
            
        } else { 
            new_ref = new_ref + '?';  
        }
        
        new_ref = new_ref + 'setting_tab=' + targ;
        
        $('.babe-settings-wrap input[name="_wp_http_referer"]').val(new_ref);
        
    });
    
    ///////////////////

    ///// Related items

    $('.related_collapsible').on('click', function(event){
        $(this).toggleClass("collapsed");
        $(this).next().toggleClass("hide");
    });

    $('.related_all_non').on('click', function(event){
        var check = true;
        $(this).siblings().find('input').each(function(ind, el){
            if ( $(el).is(':checked') ){
                check = false;
            }
        });
        $(this).siblings().find('input').prop('checked', check);
    });

    ////////////stars//////////////////////

    $('.comment-form-rating-stars .star').on('mouseover', '.fa-star, svg', function(){
        var par = $(this).parent();
        var cur_star = $(par).find('.fas, .far').first();
        var cur_star_svg = $(par).find('svg').first();
        $(cur_star_svg).attr('data-prefix', 'fas');

        $(cur_star).addClass('fas');
        $(cur_star).removeClass('far');

        $(par).prevAll().each(function(){
            var star = $(this).find('.fas, .far').first();
            $(star).addClass('fas');
            $(star).removeClass('far');

            var star_svg = $(this).find('svg').first();
            $(star_svg).attr('data-prefix', 'fas');
        });

        $(par).nextAll().each(function(){
            var star = $(this).find('.fas, .far').first();
            $(star).addClass('far');
            $(star).removeClass('fas');

            var star_svg = $(this).find('svg').first();
            $(star_svg).attr('data-prefix', 'far');
        });
    });

    $('.comment-form-rating-stars .star').on('mouseout', 'svg', function(){
        var par = $(this).parents().eq(1);
        var rating_cr = $(par).data('rating-cr');
        var rating_val = parseInt($('#rating_'+rating_cr).val());

        $(par).find('.star').each(function(){
            var star = $(this).find('.fas, .far').first();
            var star_svg = $(this).find('svg').first();

            var star_val = parseInt($(this).data('rating-val'));

            if (star_val <= rating_val){
                $(star).addClass('fas');
                $(star).removeClass('far');
                $(star_svg).attr('data-prefix', 'fas');
            } else {
                $(star).addClass('far');
                $(star).removeClass('fas');
                $(star_svg).attr('data-prefix', 'far');
            }

        });
    });

    $('.comment-form-rating-stars .star').on('mousedown', 'svg', function(){
        var rating_cr = $(this).parents().eq(1).data('rating-cr');
        var star_val = parseInt($(this).parent().data('rating-val'));
        $('#rating_'+rating_cr).val(star_val);
    });

    $('.comment-form-rating-stars').on('mouseout', function(){
        var rating_cr = $(this).data('rating-cr');
        var rating_val = parseInt($('#rating_'+rating_cr).val());

        $(this).find('.star').each(function(){
            var star = $(this).find('.fas, .far').first();
            var star_svg = $(this).find('svg').first();

            var star_val = parseInt($(this).data('rating-val'));

            if (star_val <= rating_val){
                $(star).addClass('fas');
                $(star).removeClass('far');
                $(star_svg).attr('data-prefix', 'fas');
            } else {
                $(star).addClass('far');
                $(star).removeClass('fas');
                $(star_svg).attr('data-prefix', 'far');
            }

        });
    });

    $('.comment-form-rating-stars .star').on('click', '.fa-star', function(){
        var rating_cr = $(this).parents().eq(1).data('rating-cr');
        var star_val = parseInt($(this).parent().data('rating-val'));
        $('#rating_'+rating_cr).val(star_val);
    });

});

////////////////////General functions/////////////////////

    function swal_success(){
        Swal.fire( $.extend( {
            title: babe_cmb2_lst.messages.done,
            timer: 1600,
            timerProgressBar: true,
            icon: 'success',
            didClose: (toast) => {
            }
        }, swal_config) );
    }

    function swal_success_and_reload(){
        Swal.fire( $.extend( {
            title: babe_cmb2_lst.messages.done,
            timer: 2400,
            timerProgressBar: true,
            text: babe_cmb2_lst.messages.page_will_be_reloaded,
            icon: 'success',
            didClose: (toast) => {
                // reload page
                window.location.reload(true);
            }
        }, swal_config) );
    }

    function swal_error_general(){
        Swal.fire( $.extend( {
            icon: 'error',
            title: babe_cmb2_lst.messages.oops,
            text: babe_cmb2_lst.messages.something_wrong
        }, swal_config) );
    }

})(jQuery);
