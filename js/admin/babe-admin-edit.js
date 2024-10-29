
(function($){
	"use strict";   

$(document).ready(function(){

	$( '.order_datepicker' ).datepicker({
		numberOfMonths: 1,
		dateFormat: babe_edit_lst.date_format
	});
    
    ////////////////////////////////////
    
    $('.babe_payment_request_open').click( function( event ) {
		$( this ).hide();
		$( this ).siblings( '.babe_payment_request_body').show();
	});
    
    $('.babe_payment_request_cancel').click( function( event ) {
		$( this ).parent().hide();
		$( this ).parent().siblings( '.babe_payment_request_open').show();
	});

	$('.babe_payment_request_send').click( function( event ) {
		var prepaid_amount_input = $( this ).siblings( 'input' );
        prepaid_amount_input.siblings( '.spin_f' ).addClass('active');
        
		var xhr = $.ajax({
			type:		'POST',
			url:		babe_edit_lst.ajax_url,
			data:		{
			  action : 'order_request_payment',
              prepaid_amount : parseFloat(prepaid_amount_input.val()),
              order_id : $(this).data('order-id'),
              // check
	          nonce: babe_edit_lst.nonce
		    },
			success: function( response ) {
				prepaid_amount_input.siblings( '.spin_f' ).removeClass('active');
                if ( response != ''){
                    prepaid_amount_input.parent().html(response);
                } else {
                    prepaid_amount_input.parent().siblings( '.babe_payment_request_open').show();
                    prepaid_amount_input.parent().hide();
                }
			},
            error : function(){
                prepaid_amount_input.siblings( '.spin_f' ).removeClass('active');
				prepaid_amount_input.parent().siblings( '.babe_payment_request_open').show();
				prepaid_amount_input.parent().hide();
            }
		});
	});
    
  /////////////////////////////////////      
    
});

////////////////////////////////////

})(jQuery);

