/*var app = (function() {

  var firebaseRef = new Firebase('https://menehi.firebaseio.com');
  var authClient = new FirebaseAuthClient(ref, function(error, user) {
  if (error) {
    alert(error);
    return;
  }
  if (user) {
    // User is already logged in.
    doLogin(user);
  } else {
    // User is logged out.
    showLoginBox();
  }
});
  
  var showAlert = function() {
    var fn, args = arguments;
    if (navigator && navigator.notification && navigator.notification.alert) {
      fn = navigator.notification.alert(msg);
    } else if (typeof alert === "function") {
      fn = alert;
    } else {
      fn = console.log;
    }
    fn.apply(null, args);
  }

  function login(provider) {
    firebaseRef.authWithOAuthPopup(provider, function(error, authData) {
      if (error) {
        // an error occurred while attempting login
        var message = 'An error occurred.';
        showAlert(message, function(){}, 'Failure!', 'Close');

      } else {
        // user authenticated with Firebase
        var message = 'User ID: ' + authData.uid + ', Provider: ' + authData.provider;
        showAlert(message, function(){}, 'Success!', 'Close');

        // Log out so we can log in again with a different provider.
        firebaseRef.unauth();
      }
    });
  }
  
  return {
    init: init,
    login: login
  };
})();
*/
var app = {
  
    init: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        //alert(id);
    },
    
    register: function() {
      var ref = new Firebase('https://menehi.firebaseio.com');
        ref.createUser({
          email    : $("#register-email").val(),
          password : $("#register-password").val()
        }, function(error, userData) {
          if (error) {
            console.log("Error creating user:", error);
            alert("Failed!");
          } else {
            console.log("Successfully created user account with uid:", userData.uid);
            alert("Success!");
          }
        });
    },
    
    login: function() {
      var ref = new Firebase("https://menehi.firebaseio.com");
        ref.authWithPassword({
          email    : $("#login-email").val(),
          password : $("#login-password").val()
        }, function(error, authData) {
        if (error) {
            console.log("Login Failed!", error);
        } else {
          console.log("Authenticated successfully with payload:", authData);
        }
      });
    }
    
  }
  
