var app = angular.module('main', ['ngRoute'])

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  })
  .when('/about', {
    templateUrl: 'views/about.html',
    controller: 'AboutCtrl'
  })
  .when('/404', {
    templateUrl: 'views/404.html',
    controller: '404Ctrl'
  })
  .when('/settings', {
    templateUrl: 'views/settings.html',
  })
  .when('/settings/ssh_keys', {
    templateUrl: 'views/settings_ssh_keys.html',
  })
  .when('/classes/create', {
    templateUrl: 'views/class_create.html',
    controller: 'ClassCreateCtrl'
  })
  .when('/classes/:class_name', {
    templateUrl: 'views/class.html',
    controller: 'ClassCtrl'
  })
  .when('/classes/:class_name/projects/create', {
    templateUrl: 'views/project_create.html',
  })
  .when('/classes/:class_name/projects/:project_name', {
    templateUrl: 'views/project.html',
  })
  .when('/classes/:class_name/projects/:project_name/source/:commit/:file_path*', {
    templateUrl: 'views/source_file.html',
  })
  .when('/:user_name/submissions/:submission_name', {
    templateUrl: 'views/submission.html',
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


    // github last updated
    if ($('#lastUpdated').length) { // Check if placeholder exists
      $.ajax({
        url: "https://api.github.com/repos/gitsubmit/gitsubmit.github.io/commits/master",
        dataType: "json",
        success: function (data) {
          var sha = data.sha;
          var date = jQuery.timeago(data.commit.author.date);
          $('#lastUpdated').html(date);
        }
      });
    }
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

app.controller('ClassCtrl', ['$scope', '$rootScope', '$routeParams', function($scope, $rootScope, $routeParams) {
  var class_name = $routeParams.class_name

  // TODO: Make an API call to backend here

  $rootScope.root = {
    title: 'Class ' + class_name + ' | GitSubmit'
  }

  $scope.class_name = class_name
}])

app.controller('ClassCreateCtrl', function($scope, $rootScope) {
  $rootScope.root = {
    title: 'Create a New Class'
  }

  $scope.formSubmit = function() {
    alert($scope.class_name + ' ' + $scope.class_id)

    // TODO
    var url = '';
    $http.post(url, {
      class_name: $scope.class_name,
      url_name: $scope.class_id,
      description: $scope.class_description,
    }).then(function(response) {
      // success
    }, function(response) {
      // error
    })
  }
})
