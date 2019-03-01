import CryptoJS from './core.js';
import './sha256.js';

var salt = $("meta[name=salt]").attr("content");
$(document).ready(function () {
    $("#login").click(hash);
    if ($(".toast")[0]) {
        $(".toast").toast('show');
    }
});

function hash() {
    var password = $("#password").val();
    if (password != '') {
        password = CryptoJS.SHA256(password + salt).toString();
        $("#password").val(password);
    }
}