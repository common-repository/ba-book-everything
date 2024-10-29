(function($){
    "use strict";

    const swal_config = {
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: babe_prices_lst.messages.ok,
        cancelButtonText: babe_prices_lst.messages.cancel,
        showClass: {
            popup: 'animate__animated animate__fadeIn animate__fast'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOut animate__faster'
        }
    };

    const Toast = Swal.mixin(swal_config);

    $(document).ready(function(){

       //////////////////////////////
       
       $('#categories').on('change', function(){
          get_prices_form();
          get_prices_block();
       });
       
       ////////////////////////////////
       
       $('#prices-block').on('click', '.view-rate-title', function(){
           var rate_id = $(this).data('rate-id');
           $(this).toggleClass('opened');
           $('.view-rate-block .view-rate-details[data-rate-id="'+rate_id+'"]').toggleClass('opened');
       });
       
       ///////////////////delete rate/////////////////////////////    

       $('#prices-block').on('click', '.view-rate-details-item-del', function(event){

           let rate_id = $(this).data('rate-id');
           let rate_details = $(this).parent();
           let rate_block = $(rate_details).parent();

           Toast.fire({
               icon: 'question',
               showCancelButton: true,
               confirmButtonText: babe_prices_lst.messages.delete,
               title: babe_prices_lst.messages.are_you_sure
           }).then((result) => {
               if (result.isConfirmed) {
                   $.ajax({
                       type:	'POST',
                       url:		babe_prices_lst.ajax_url,
                       data:	{
                           action : 'delete_rate',
                           post_id : $('#prices-block').data('obj-id'),
                           rate_id : rate_id,
                           // check
                           nonce : babe_prices_lst.nonce
                       },
                       success: function( msg ) {
                           if ( parseInt(msg) === 1 ){
                               get_prices_block();
                               swal_success();
                           } else {
                               swal_error_general();
                           }
                       },
                       error : function(){
                           swal_error_general();
                       }
                   });
               }
           });
       }); ///////  end click delete

        //////////////////////////////////////

        $('#prices-form').on('click', '#rate_new_open', function(el){
            el.stopPropagation();
            el.preventDefault();
            edit_rate({});
        });

        $('#prices-block').on('click', '.view-rate-details-item-edit', function(el){
            el.stopPropagation();
            el.preventDefault();
            let preset = $(this).data('rate');
            edit_rate(preset);
        });

        $('#prices-block').on('click', '.view-rate-details-item-clone', function(el){
            el.stopPropagation();
            el.preventDefault();
            let preset = $(this).data('rate');
            preset.rate_id = '';
            preset.rate_title = '';
            edit_rate(preset);
        });

        function edit_rate(preset){

            let rate_id = !$.isEmptyObject( preset ) ? preset.rate_id : '';

            let template_html = $('#swal_new_rate').html();
            $('#swal_new_rate').html('');

            Toast.fire({
                html: template_html,
                showCancelButton: true,
                confirmButtonText: babe_prices_lst.messages.save_rate,
                didOpen: () => {

                    if ( !$.isEmptyObject( preset ) ){

                        $('#_rate_title').val(preset.rate_title);
                        $('#_rate_date_from').val(preset.date_from);
                        $('#_rate_date_to').val(preset.date_to);
                        $('#_price_from').val(preset.price_from);
                        if( preset.min_booking_period > 0 ){
                            $('#_rate_min_booking').val( preset.min_booking_period );
                        }
                        if( preset.max_booking_period > 0 ){
                            $('#_rate_max_booking').val( preset.max_booking_period );
                        }

                        $("#swal_new_rate_fields .set-age-price.age-price-general").each(function(ind, elm){
                            let age_ind = $(elm).data('ind');
                            if ( preset.price_general.hasOwnProperty(age_ind) && preset.price_general[age_ind] != '' ){
                                $(elm).val(preset.price_general[age_ind]);
                            }
                        });

                        $('#swal_new_rate_fields input[name^="apply_days"]').each(function(i, el){
                            let ind = $(el).val();
                            if ( preset.apply_days.hasOwnProperty(ind) && preset.apply_days[ind] == ind ){
                                $(el).prop('checked', true);
                            } else {
                                $(el).prop('checked', false);
                            }
                        });

                        $('#swal_new_rate_fields input[name^="start_days"]').each(function(i, el){
                            let ind = $(el).val();
                            if ( preset.start_days.hasOwnProperty(ind) && preset.start_days[ind] == ind ){
                                $(el).prop('checked', true);
                            } else {
                                $(el).prop('checked', false);
                            }
                        });

                        fill_conditional_prices( preset.prices_conditional );
                    }

                    $('#_rate_date_from, #_rate_date_to').datepicker({
                        numberOfMonths: 1,
                        dateFormat: babe_prices_lst.date_format,
                        beforeShow: function (textbox, instance) {
                            setTimeout(function () {
                                instance.dpDiv.css({
                                    'top': ( textbox.getBoundingClientRect().top + textbox.offsetHeight + 10) + 'px',
                                    'z-index': '100010'
                                });
                            }, 10);
                        }
                    });
                },
                preConfirm: () => {
                    let start_days = {};
                    $('#swal_new_rate_fields input[name^="start_days"]').each(function(i, el){
                        var ind = $(el).val();
                        if ($(el).is(':checked')){
                            start_days[ind] = ind;
                        }
                    });
                    let apply_days = {};
                    $('#swal_new_rate_fields input[name^="apply_days"]').each(function(i, el){
                        var ind = $(el).val();
                        if ($(el).is(':checked')){
                            apply_days[ind] = ind;
                        }
                    });
                    let _price_general = {};
                    $("#swal_new_rate_fields .set-age-price.age-price-general").each(function(ind, elm){
                        if ($(elm).val() != ''){
                            _price_general[$(elm).data('ind')] = $(elm).val();
                        }
                    });
                    let _price_general_check = {};
                    $("#swal_new_rate_fields .set-age-price.age-price-general").each(function(ind, elm){_price_general_check[$(elm).data('ind')] = '';});

                    //////////////

                    let _prices_conditional = collect_conditional_prices();

                    //////////////

                    let price_adult_check = $("#swal_new_rate_fields .set-age-price.age-price-general").first().val();

                    if( $('#swal_new_rate_fields #_rate_title').val() == '' ){
                        return false;
                    }

                    let result = {
                        _rate_title : $('#_rate_title').val(),
                        _rate_date_from : $('#_rate_date_from').val(),
                        _rate_date_to : $('#_rate_date_to').val(),
                        _price_from : $('#_price_from').val(),
                        _rate_min_booking : $('#_rate_min_booking').val(),
                        _rate_max_booking : $('#_rate_max_booking').val(),
                        start_days: start_days,
                        apply_days: apply_days,
                        _price_general: _price_general,
                        price_adult_check: price_adult_check,
                        _prices_conditional: _prices_conditional,
                        _price_general_check: _price_general_check,
                    };
                    return result;
                }
            }).then((result) => {
                if (result.isConfirmed) {

                    Swal.showLoading();

                    $.ajax({
                        url : babe_prices_lst.ajax_url,
                        type : 'POST',
                        data : {
                            action : 'save_rate',
                            cat_slug : $('#categories').val(),
                            post_id : $('#prices-form').data('obj-id'),
                            rate_id: rate_id,
                            _rate_title: result.value._rate_title,
                            _rate_date_from: result.value._rate_date_from,
                            _rate_date_to: result.value._rate_date_to,
                            _rate_min_booking: result.value._rate_min_booking,
                            _rate_max_booking: result.value._rate_max_booking,
                            _price_general: result.value._price_general,
                            _price_from: result.value._price_from,
                            _prices_conditional: result.value._prices_conditional,
                            start_days: result.value.start_days,
                            apply_days: result.value.apply_days,
                            // check
                            nonce : babe_prices_lst.nonce
                        },
                        success : function( msg ) {
                            clear_prices_form();
                            get_prices_block();
                            swal_success();
                        },
                        error : function() {
                            swal_error_general();
                        }
                    }).always( function(){
                        Swal.hideLoading();
                    });
                }

                $('#swal_new_rate').html(template_html);
            });
        }

        //////////////////////////////////////

        $('#prices-form').on('click', '#add_price', function(el){
            el.stopPropagation();
            el.preventDefault();
            save_prices();
        });

        function fill_conditional_prices( preset_prices_conditional ){

            if ( preset_prices_conditional === '' ){
                return;
            }

            for (let key in preset_prices_conditional){
                let prices_conditional = preset_prices_conditional[key];

                if ( $('#rate-price-conditional-generator [name="conditional_guests_sign_tmp"]').length && prices_conditional.hasOwnProperty('conditional_guests_sign') ){
                    $('#rate-price-conditional-generator [name="conditional_guests_sign_tmp"]').val( prices_conditional.conditional_guests_sign );
                    $('#rate-price-conditional-generator [name="conditional_guests_number_tmp"]').val(prices_conditional.conditional_guests_number);
                }

                if ( $('#rate-price-conditional-generator [name="conditional_units_sign_tmp"]').length && prices_conditional.hasOwnProperty('conditional_units_sign') ){
                    $('#rate-price-conditional-generator [name="conditional_units_sign_tmp"]').val( prices_conditional.conditional_units_sign );
                    $('#rate-price-conditional-generator [name="conditional_units_number_tmp"]').val(prices_conditional.conditional_units_number);
                }

                $('#rate-price-conditional-generator').find('input.age-price-conditional-tmp').each( function(ind, elm){
                    let age_ind = $(elm).data('ind');
                    if ( prices_conditional.hasOwnProperty('conditional_price') && prices_conditional.conditional_price.hasOwnProperty(age_ind) ){
                        $(elm).val( prices_conditional.conditional_price[age_ind] );
                    }
                });
                $('#rate-price-conditional-generator #add_price_conditional').trigger('click');
            }
        }

        if ( $('#rate-price-conditional-value').length > 0 && $('#rate-price-conditional-value').val() ){
            try {
                let preset_prices_conditional = JSON.parse( $('#rate-price-conditional-value').val() );
                setTimeout(function () {
                    fill_conditional_prices( preset_prices_conditional );
                }, 10);
            } catch ( e ) {
                return false;
            }
        }

        function collect_conditional_prices(){
            let _prices_conditional = {};
            $("#rate-price-conditional-holder").children().each(function(ind, elm){
                _prices_conditional[ind] = {};
                _prices_conditional[ind].order = $(elm).find('input[name="conditional_order"]').val();
                if ($(elm).find('input[name="conditional_guests_sign"]').length){
                    _prices_conditional[ind].conditional_guests_sign = $(elm).find('input[name="conditional_guests_sign"]').val();
                    _prices_conditional[ind].conditional_guests_number = $(elm).find('input[name="conditional_guests_number"]').val();
                }
                if ($(elm).find('input[name="conditional_units_sign"]').length){
                    _prices_conditional[ind].conditional_units_sign = $(elm).find('input[name="conditional_units_sign"]').val();
                    _prices_conditional[ind].conditional_units_number = $(elm).find('input[name="conditional_units_number"]').val();
                }

                let _prices_conditional_tmp = {};
                $('#rate-price-conditional-generator').find(".set-age-price.age-price-conditional-tmp").each(function(ind2, elm2){
                    let age_index = $(elm2).data('ind');
                    if ($(elm).find('input[name="conditional_price['+age_index+']"]').val() != ''){
                        _prices_conditional_tmp[age_index] = $(elm).find('input[name="conditional_price['+age_index+']"]').val();
                    }
                });
                _prices_conditional[ind].conditional_price = _prices_conditional_tmp;
            });
            if ( $('#rate-price-conditional-value').length > 0 ){
                $('#rate-price-conditional-value').val( JSON.stringify(_prices_conditional) );
            }

            return _prices_conditional;
        }

       /////////////////get_prices_block///////////////////////////////    

       function get_prices_block(){
        
        let cat_slug = $('#categories').val();
                       
           //$('#prices-block').html('<span class="spin_f"><i class="fas fa-spinner fa-spin fa-2x"></i></span>');      
        $.ajax({
		url : babe_prices_lst.ajax_url,
		type : 'POST',
		data : {
			action : 'get_price_details_block',
            cat_slug : cat_slug,
            post_id : $('#prices-block').data('obj-id'),
            // check
	        nonce : babe_prices_lst.nonce
		},
		success : function( msg ) {
            $("#prices-block").html(msg);
            ///////////////
            $( '#prices-block' ).sortable({
                axis: "y",
                placeholder: "ui-state-highlight",
                update: function( event, ui ) {
                    let count = $('#prices-block').children().length;
                   if (count){
                       let i = 1;
                       let rate_orders = {};
                    $('#prices-block').children().each(function(ind, elm){
                        $(elm).attr('data-order', i);
                        rate_orders[$(elm).data('rate-id')] = i;
                        i++;
                    });
                    rates_reorder(rate_orders);
                   }
                }
            });
		  }
        });
      }
      
      /////////////////rates_reorder///////////////////////////////    

       function rates_reorder(rate_orders){

           let cat_slug = $('#categories').val();
          
           $('#prices-block').css('opacity', '0.5');
                       
           $.ajax({
		   url : babe_prices_lst.ajax_url,
		   type : 'POST',
		   data : {
			action : 'rates_reorder',
            rate_orders : rate_orders,
            post_id : $('#prices-block').data('obj-id'),
            // check
	        nonce : babe_prices_lst.nonce
		   },
		   success : function( msg ) {
            $('#prices-block').css('opacity', '1');   
		   },
           error : function() {
            $('#prices-block').css('opacity', '1');
           }
          });
       }
           
       /////////////////get_prices_form///////////////////////////////    

       function get_prices_form(){

           let cat_slug = $('#categories').val();
                       
           $('#prices-form').html('<span class="spin_f"><i class="fas fa-spinner fa-spin fa-2x"></i></span>');      
        $.ajax({
		url : babe_prices_lst.ajax_url,
		type : 'POST',
		data : {
			action : 'get_price_details_form',
            cat_slug : cat_slug,
            post_id : $('#prices-form').data('obj-id'),
            // check
	        nonce : babe_prices_lst.nonce
		},
		success : function( msg ) {
            $("#prices-form").html(msg);
		  }
        });
       }
    
    /////////////////clear_prices_form///////////////////////////////    

       function clear_prices_form(){
          $('#prices-form').find('input[type="text"]').val('');
          $('#rate-price-conditional-holder').html('');
       }
    
    ///////////////conditional////////
    
    $('body').on('change', '#rate-price-conditional-generator select', function(ev){
        let val = parseInt($(this).val());
        if (val == 0){
            $(this).addClass('select_option_gray');
        } else {
            $(this).removeClass('select_option_gray');
        }
    });
    
    ///////////add_price_conditional

        $('body').on('click', '#rate-price-conditional-holder .conditional_price_block .conditional_price_block_delete', function(ev){
            ev.stopPropagation();
            ev.preventDefault();
            $(this).parent().remove();
            collect_conditional_prices();
        });

        $('body').on('click', '#add_price_conditional_cancel', function(ev){
            ev.stopPropagation();
            ev.preventDefault();
            $(this).parents().eq(1).find('.conditional_price_block_editing').removeClass('conditional_price_block_editing');
            $(this).parent().find('input').val('');
            $(this).parent().find('select').val(0).trigger('change');
        });

        $('body').on('click', '#rate-price-conditional-holder .conditional_price_block .conditional_price_block_edit', function(ev){
            ev.stopPropagation();
            ev.preventDefault();
            let li = $(this).parent();
            $(li).addClass('conditional_price_block_editing');
            let li_ind = $(li).data('ind');

            $('#rate-price-conditional-generator [name="conditional_tmp_ind"]').val(li_ind);

            if ( $('#rate-price-conditional-generator [name="conditional_guests_sign_tmp"]').length ){
                $('#rate-price-conditional-generator [name="conditional_guests_sign_tmp"]').val($(li).find('[name="conditional_guests_sign"]').val());
                $('#rate-price-conditional-generator [name="conditional_guests_number_tmp"]').val($(li).find('[name="conditional_guests_number"]').val());
            }

            if ( $('#rate-price-conditional-generator [name="conditional_units_sign_tmp"]').length ){
                $('#rate-price-conditional-generator [name="conditional_units_sign_tmp"]').val($(li).find('[name="conditional_units_sign"]').val());
                $('#rate-price-conditional-generator [name="conditional_units_number_tmp"]').val($(li).find('[name="conditional_units_number"]').val());
            }

            $('#rate-price-conditional-generator').find('input.age-price-conditional-tmp').each( function(ind, elm){
                let age_ind = $(elm).data('ind');
                if ( $(li).find('[name="conditional_price['+age_ind+']"]').length ){
                    $(elm).val( $(li).find('[name="conditional_price['+age_ind+']"]').val() );
                }
            });
        });

    $('body').on('click', '#rate-price-conditional-generator #add_price_conditional', function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        
        let result_block = $('#rate-price-conditional-holder');

        let guests_sign = parseInt($('#rate-price-conditional-generator select[name="conditional_guests_sign_tmp"]').val());
        let guests_number = parseInt($('#rate-price-conditional-generator input[name="conditional_guests_number_tmp"]').val());
        let units_sign = parseInt($('#rate-price-conditional-generator select[name="conditional_units_sign_tmp"]').val());
        let units_number = parseInt($('#rate-price-conditional-generator input[name="conditional_units_number_tmp"]').val());
        
        if ( isNaN(guests_sign) ) {
            guests_sign = 0;
        }
        if ( isNaN(guests_number) ){
            guests_number = '';
        }
        if ( isNaN(units_sign) ){
            units_sign = 0;
        }
        if ( isNaN(units_number) ){
            units_number = '';
        }

        let _price_general = {};
        $("#rate-price-conditional-generator .set-age-price.age-price-conditional-tmp").each(function(){_price_general[$(this).data('ind')] = $(this).val();});

        let price_adult_check = $("#rate-price-conditional-generator .set-age-price.age-price-conditional-tmp").first().val();
        
        if ( ( (guests_sign && guests_number != '') || (units_sign && units_number != '') ) ){
            ////////////
            let count = $(result_block).children().length;
            let li_ind = parseInt($('#rate-price-conditional-generator [name="conditional_tmp_ind"]').val());
            let index = li_ind > 0 ? li_ind : count + 1;
            let html = '<div class="conditional_price_block_inner">';
            let html_inputs = '<input type="hidden" name="conditional_order" value="'+index+'">';
            
            if (guests_sign){
                
                html_inputs += '<input type="hidden" name="conditional_guests_sign" value="'+guests_sign+'">';
                html_inputs += '<input type="hidden" name="conditional_guests_number" value="'+guests_number+'">';
                html += $('#rate-price-conditional-generator .conditional_guests_number_label').html() + ' ' + $('#rate-price-conditional-generator select[name="conditional_guests_sign_tmp"] option:selected').text() + ' ' + guests_number;
            }
            if (units_sign){
                
                if (guests_sign){
                    html += ' '+ $('#rate-price-conditional-generator .conditional_operator_label').html() + ' ';
                }
                
                html_inputs += '<input type="hidden" name="conditional_units_sign" value="'+units_sign+'">';
                html_inputs += '<input type="hidden" name="conditional_units_number" value="'+units_number+'">';
                html += $('#rate-price-conditional-generator .conditional_units_number_label').html() + ' ' + $('#rate-price-conditional-generator select[name="conditional_units_sign_tmp"] option:selected').text() + ' ' + units_number;
            }
            
            html += ' ' + $('#rate-price-conditional-generator .conditional_result_label').html() + ' ';
            
            $('#rate-price-conditional-generator').find(".set-age-price.age-price-conditional-tmp").each(function(ind, elm){
                let cur_price = $(elm).val();
                let age_index = $(elm).data('ind');
                let age_label = $(elm).closest('tr').find('.age_title').text();
                html += age_label + cur_price + ' ';
                html_inputs += '<input type="hidden" name="conditional_price['+age_index+']" value="'+cur_price+'">';
            });
            
            html += '</div>'+html_inputs+'<i class="conditional_price_block_edit fas fa-edit"></i><i class="conditional_price_block_delete fas fa-trash-alt"></i>';

            if ( li_ind > 0 ){
                $(result_block).find('li[data-ind="'+index+'"]').html(html).removeClass('conditional_price_block_editing');
            } else {
                html = '<li class="conditional_price_block" data-ind="'+index+'">'+html+'</li>';
                $(result_block).append(html);
            }

            $(this).parent().find('input').val('');
            $(this).parent().find('select').val(0).trigger('change');
            
            $( result_block ).sortable({
                axis: "y",
                placeholder: "ui-state-highlight",
                update: function( event, ui ) {
                    let i = 1;
                    $(result_block).children().each(function(ind, elm){
                        $(elm).find('input[name="conditional_order"]').val(i);
                        $(elm).attr('data-ind', i);
                        i++;
                    });
                    collect_conditional_prices();
                }
            });
            ///////////////////
            collect_conditional_prices();
        }
    });

  ///////////////////////////
    });

    ////////////////////General functions/////////////////////

    function swal_success(){
        Swal.fire( $.extend( {
            title: babe_prices_lst.messages.done,
            timer: 1600,
            timerProgressBar: true,
            icon: 'success',
            didClose: (toast) => {
            }
        }, swal_config) );
    }

    function swal_success_and_reload(){
        Swal.fire( $.extend( {
            title: babe_prices_lst.messages.done,
            timer: 2400,
            timerProgressBar: true,
            text: babe_prices_lst.messages.page_will_be_reloaded,
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
            title: babe_prices_lst.messages.oops,
            text: babe_prices_lst.messages.something_wrong
        }, swal_config) );
    }

})(jQuery);

