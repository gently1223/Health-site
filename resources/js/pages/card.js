$(function() {
    $('#card_number').unbind().on('keyup', function() {
        let card_number = $(this).val().replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let matches = card_number.match(/\d{4,16}/g);
        let match = matches && matches[0] || '';
        let parts = [];

        for (i=0, len=match.length; i<len; i+=4) {
            parts.push(match.substring(i, i+4));
        }

        if (parts.length) {
            $('#card_number').val(parts.join(' '));
        }
    });

    $('#cancelChangeCard').unbind().bind('click', function() {
        $('.changeCardForm').addClass('hide');
        $('#changeCard').removeClass('hide');
    });

    $('#changeCard').unbind().bind('click', function() {
        $('.changeCardForm').removeClass('hide');
        $('#changeCard').addClass('hide');
    });
});
