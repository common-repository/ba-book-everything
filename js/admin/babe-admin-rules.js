(function($){
    "use strict";

    const swal_config = {
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: babe_rules_lst.messages.ok,
        cancelButtonText: babe_rules_lst.messages.cancel,
        showClass: {
            popup: 'animate__animated animate__fadeIn animate__fast'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOut animate__faster'
        }
    };

    const Toast = Swal.mixin(swal_config);

    $(document).ready(function(){

        $('#booking-rules-table').on('click', '.booking_rule_edit', function(event){

            event.stopPropagation();
            let booking_rule_id = $(this).data('i');
            let preset = $(this).data('rule');
            if ( $.isEmptyObject( preset ) ){
                return false;
            }

            let $root = $('html, body');
            $root.animate({
                scrollTop: $('#rule_title').offset().top - 150
            }, 500);

            const inputTextGroup = {
                rule_title: 'rule_title',
                hold: 'hold',
                stop_booking_before: 'stop_booking_before',
                deposit: 'deposit',
                rule_id: 'rule_id'
            };

            const inputRadioGroup = {
                basic_booking_period: 'basic_booking_period',
                ages: 'ages',
                payment_model: 'payment_model',
                recurrent_payments: 'recurrent_payments',
                booking_mode: 'booking_mode'
            };

            for (let key in inputTextGroup){
                $('#'+key).val(preset[key]);
            }

            $('input:radio[name^="babe_tmp_settings"]').prop('checked', false);

            for (let key in inputRadioGroup){
                $('input[name="babe_tmp_settings['+key+']"]').each(function(i, el){
                    let val = $(el).val();
                    if ( val === preset[key] ){
                        $(el).prop('checked', true);
                    }
                });
            }

            $('#cancel').removeClass('hidden');
            $('#submit').val(babe_rules_lst.messages.update_rule);
        });

        $('#cancel').on('click', function(event){
            event.stopPropagation();
            $('#cancel').addClass('hidden');
            $('#submit').val(babe_rules_lst.messages.add_rule);
            //////reload page
            window.location.reload(true);
        });

        ////////////////////////////////////////////////

        $('#booking-rules-table').on('click', '.booking_rule_del', function(event){
            event.stopPropagation();
            let booking_rule_id = $(this).data('i');

            Toast.fire({
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: babe_rules_lst.messages.delete,
                title: babe_rules_lst.messages.are_you_sure
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url : babe_rules_lst.ajax_url,
                        type : 'POST',
                        data : {
                            action : 'del_rule',
                            booking_rule_id : booking_rule_id,
                            // check
                            nonce : babe_rules_lst.nonce
                        },
                        success: function( msg ) {
                            $("#booking-rules-table").html(msg);
                            swal_success();
                        },
                        error : function(){
                            swal_error_general();
                        }
                    });
                }
            });
        });

    });

    ////////////////////General functions/////////////////////

    function swal_success(){
        Swal.fire( $.extend( {
            title: babe_rules_lst.messages.done,
            timer: 1600,
            timerProgressBar: true,
            icon: 'success',
            didClose: (toast) => {
            }
        }, swal_config) );
    }

    function swal_success_and_reload(){
        Swal.fire( $.extend( {
            title: babe_rules_lst.messages.done,
            timer: 2400,
            timerProgressBar: true,
            text: babe_rules_lst.messages.page_will_be_reloaded,
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
            title: babe_rules_lst.messages.oops,
            text: babe_rules_lst.messages.something_wrong
        }, swal_config) );
    }

})(jQuery);
