var app = angular.module('main', ['ngRoute'])

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'home.html',
    controller: 'HomeCtrl'
  })
  .when('/about', {
    templateUrl: 'about.html',
    controller: 'AboutCtrl'
  })
  .when('/404', {
    templateUrl: '404.html',
    controller: '404Ctrl'
  })
  .otherwise({
    redirectTo: '/404'
  })
}])

app.run(function($rootScope, $location) {
  // index.html JavaScript setup code
  $(document).ready(function() {
    // Detect touch screen and enable scrollbar if necessary
    function is_touch_device() {
      try {
        document.createEvent("TouchEvent")
        return true
      } catch (e) {
        return false
      }
    }
    if (is_touch_device()) {
      $('#nav-mobile').css({ overflow: 'auto'})
    }

    // Plugin initialization for elements in index.html, such as <nav>
    // Plugin initialization for views should be in their corresponding controllers.
    $('.button-collapse').sideNav({'edge': 'left'})
  })
})

app.controller('HomeCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
  $rootScope.root = {
    route: 'Home',  // this corresponds to the menu item that should be active
    title: 'Home | GitSubmit'
  }
}])

app.controller('AboutCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
  $rootScope.root = {
    route: 'About',  // this corresponds to the menu item that should be active
    title: 'About | GitSubmit'
  }

  $(document).ready(function() {
    $('.parallax').parallax()
  })
}])

app.controller('404Ctrl', ['$scope', '$rootScope', function($scope, $rootScope) {
  $rootScope.root = {
    title: '404 | GitSubmit'
  }
}])
