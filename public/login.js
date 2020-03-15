const { ipcRenderer } = require("electron");

ipcRenderer.on('resetvals', () => {
    $('#authip').val('');
    $('#chatip').val('');
    $('#username').val('');
});

$('.form-control').click(() => {
    $('#authip').removeClass('red-border');
    $('#chatip').removeClass('red-border');
    $('#username').removeClass('red-border');
});

$('#connectbtn').click(() => {
    if ($('#authip').val() === "" || $('#chatip').val() === "" || $('#username').val() === "") {
        // From what i know, there is no nice way to code this.
        $('.card').effect('shake', {direction:'left',distance:8, times: 3}, 500);
        if ($('#authip').val() === "") {
            $('#authip').addClass('red-border');
        }
        if ($('#chatip').val() === "") {
            $('#chatip').addClass('red-border');
        }
        if ($('#username').val() === "") {
            $('#username').addClass('red-border');
        }
        return;
    }
    ipcRenderer.send('connect', $('#authip').val(), $('#chatip').val(), $('#username').val());
});