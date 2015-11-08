
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
                console.log('trying to login: ' + $("#register-email").val());

                var email = $("#register-email").val();
                var password = $("#register-password").val();

                doLogin(email, password);
        }
    );


    $("#opener-logout").click(function () {
        authClient.logout();
    });
});

function scrollToPage(index) {
    $("#body-view").animate({left: -100 * index + "%"}, 400);
    $(".tab").removeClass("selected");
    $(".tab:eq(" + index + ")").addClass("selected");
}

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
        $("#login-page").hide();
           
        $("#body-view").show();
        $("#tab-bar").show();
        $("#login-page").hide();
        
        $(function() {
          console.log("hello there");
          getTransactions();
        });
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


function getTransactions() {
    
    console.log(myUser.id);
    var id = myUser.id;
    var dbref = new Firebase("https://menehi.firebaseio.com/transactions/"+id);
        
    dbref.on("value", function(snapshot) {
      var val = snapshot.val();
      console.log(val);
      for (var i in val) {
          $("#transaction-history").append("<tr><td>"+i+"</td><td>"+val[i]+"</td></tr>");
          console.log(val[i]);
      }
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
    $("#transaction-history").show();
}