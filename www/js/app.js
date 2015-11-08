
// CHANGE THIS to your own firebase
var ref = new Firebase("https://menehi.firebaseio.com");

// global user (is this a good thing?)
myUser = -1;

$(function () {
    $("#opener-register").click(
        function () {

                var email = $("#register-email").val();
                var password = $("#register-password").val();
                authClient.createUser(email, password, function (error, user) {
                    if (!error) {
                        console.log('logging new registered user');
                        doLogin(email, password);
                    } else {
                        alert(error);
                    }
                });

        }
    );

    $("#opener-login").click(function () {
                console.log('trying to login: ' + $("#login-email").val());

                var email = $("#login-email").val();
                var password = $("#login-password").val();

                doLogin(email, password);
        }
    );


    $("#opener-logout").click(function () {
        authClient.logout();
    });
});

function doLogin(email, password) {
    authClient.login('password', {
        email: email,
        password: password
    });
};

var authClient = new FirebaseSimpleLogin(ref, function (error, user) {
    if (error) {
        alert(error);
        return;
    }
    if (user) {
        // User is already logged in.
        console.log('User ID: ' + user.id + ', Provider: ' + user.provider);
        myUser = user;
        // doLogin(user);
        console.log('logged in')
        $("#opener-logout").attr('disabled', false);
        $("#opener-login").attr('disabled', true);
        
        $("#body-view").show();
        $("#tab-bar").show();
        $("#login-page").hide();
    } else {
        // User is logged out.
        console.log('logged out');
        $("#opener-logout").attr('disabled', true);
        $("#opener-login").attr('disabled', false);
        // ("#dialog-form").dialog("open");
        $("#body-view").hide();
        $("#tab-bar").hide();
        $("#login-page").show();
    }
});