var app = angular.module('main', ['ngRoute', 'ngStorage'])

app.constant('Consts', {
  API_RESPONSE_CACHE_EXPIRATION: 5 * 60 * 1000 * 1000,  // 5 mins
  GITHUB_API_REPO: 'https://api.github.com/repos/gitsubmit/gitsubmit.github.io/commits/master',
})

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
    controller: 'ProjectCreateCtrl'
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

app.factory('cachedGet', function($http, $localStorage, Consts) {
  return function(url, cacheKey, callbackSuccess, callbackFailure) {
    if (!$localStorage[cacheKey + '_data'] ||
        !$localStorage[cacheKey + '_timestamp'] ||
        ((new Date().getTime() - $localStorage[cacheKey + '_timestamp']) >= Consts.API_RESPONSE_CACHE_EXPIRATION)) {
      $http.get(url).then(function(response) {
        $localStorage[cacheKey + '_data'] = response
        $localStorage[cacheKey + '_timestamp'] = new Date().getTime()
        callbackSuccess(response)
        console.log('success')
      }, function(response) {
        callbackFailure(response)
        console.log('failure')
      })
    } else {
      callbackSuccess($localStorage[cacheKey + '_data'])
    }
  }
})

app.run(function($rootScope, $location, Consts, cachedGet) {
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
      cachedGet(Consts.GITHUB_API_REPO, 'github_api_repo', function(response) {
        var data = response.data
        var date = jQuery.timeago(data.commit.author.date);
        $('#lastUpdated').html(date);
      }, function(response) {
        $('#lastUpdated').html('Failed to update')
      })
    }
  })
})

app.controller('HomeCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
  $rootScope.root = {
    route: 'Home',  // this corresponds to the menu item that should be active
    title: 'Home | GitSubmit'
  }

  $(document).ready(function() {
    // close navbar if open
    $('#sidenav-overlay').trigger('click');
  })
}])

app.controller('AboutCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
  $rootScope.root = {
    route: 'About',  // this corresponds to the menu item that should be active
    title: 'About | GitSubmit'
  }

  $(document).ready(function() {
    // close navbar if open
    $('#sidenav-overlay').trigger('click');
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

app.controller('ClassCreateCtrl', function($scope, $rootScope, $http) {
  $rootScope.root = {
    title: 'Create a New Class'
  }

  // formStatus = 0: not submitted
  // formStatus != 0: submitted but failed
  $scope.formStatus = 0

  $scope.formSubmit = function(isValid) {
    if (!isValid) return

    alert($scope.class_name + ' ' + $scope.class_id)

    $('input[type="submit"]').removeClass('green').addClass('disabled')
    // TODO
    var url = '';
    $http.post(url, {
      class_name: $scope.class_name,
      url_name: $scope.class_id,
      description: $scope.class_description,
    }).then(function(response) {
      // success
      // TODO: redirect to /classes/ view
    }, function(response) {
      // error
      // TODO: notify user of error
      $('input[type="submit"]').removeClass('disabled').addClass('red')
      $scope.formStatus = 1
    })
  }
})

app.controller('ProjectCreateCtrl', function($scope, $rootScope) {
  $rootScope.root = {
    title: 'Create a Project'
  }

  $scope.formStatus = 0

  $scope.formSubmit = function(isValid) {
    if (!isValid) return
  }

  $(document).ready(function() {
    $('.datepicker').pickadate({
      selectMonths: true,
      selectYears: 4,
      min: 1        // minimum is 1 day
    })
    $('select').material_select()
  })
})
