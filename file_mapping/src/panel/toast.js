export default function toast(message, level, delay=2000) {
    var code = '<div class="toast mx-auto mt-2 font-weight-bold text-center" role="alert" aria-live="assertive" aria-atomic="true" data-delay="{{delay}}"><div class="toast-body bg-{{level}} text-white">{{message}}</div></div>';
    code = code.replace('{{message}}', message);
    code = code.replace('{{level}}', level);
    code = code.replace('{{delay}}', String(delay));
    $("#toast-container").append(code);
    var toast = $("#toast-container .toast:last");
    toast.toast("show");
    setTimeout(function () {
        toast.remove();
    }, delay + 2000);
}