$(function() {
    employee.role();

    $('#is_admin').bind('change', function() {
        employee.role();
    });
});

employee = {
    role: function() {
        $('label[for="is_admin"] span').html($('#is_admin:checked').length ? $('label[for="is_admin"] span').attr('data-admin') : $('label[for="is_admin"] span').attr('data-employee'));
    }
}
