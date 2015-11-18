var app = angular.module('main', ['ngRoute', 'ngStorage'])

app.constant('Consts', {
  API_RESPONSE_CACHE_EXPIRATION: 5 * 60 * 1000 * 1000,  // 5 mins
  GITHUB_API_REPO: 'https://api.github.com/repos/gitsubmit/gitsubmit.github.io/commits/master',
  API_SERVER: typeof(API_SERVER) !== 'undefined' ? API_SERVER : 'http://api.gitsubmit.com'
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
  .when('/login', {
    templateUrl: 'login.html',
    controller: 'LoginCtrl'
    //controller: 'FormLoginCtrl'
  })
  .when('/signup', {
    templateUrl: 'signup.html',
    controller: 'SignupCtrl'
  })
  .when('/404', {
    templateUrl: 'views/404.html',
    controller: '404Ctrl'
  })
  .when('/settings', {
    templateUrl: 'views/settings.html',
    controller: 'SettingsCtrl'
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
    controller: 'FileBrowseCtrl'
  })
  .when('/:user_name/submissions/:submission_name', {
    templateUrl: 'views/submission.html',
  })
  .otherwise({
    redirectTo: '/404'
  })
}])

app.factory('escapeHtml', function() {
  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  }

  return function(str) {
    return String(str).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s]
    })
  }
})

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

  $scope.isLoggedIn = false

  $scope.classes = [
    {
      class_id: 'cs4485f15',
      class_name: 'CS 4485 Senior Design Project',
      prof_name: 'Razos'
    }, {
      class_id: 'meh',
      class_name: 'Class Meh'
    }
  ]

  $scope.projects = [
    {
      class_id: 'cs4485f15',
      project_id: 'cs4485f15-final',
      due_date: '12/02/2015'
    }
  ]

  $scope.submissions = [
    {
      username: 'sonph',
      submission_id: 'gitsubmit',
      project: 'CS 4485 Final'
    }
  ]

  $(document).ready(function() {
    // close navbar if open
    $('#sidenav-overlay').trigger('click');
    $('.parallax').parallax()
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

app.controller('LoginCtrl', function($scope, $rootScope, $http, $localStorage, Consts) {
  $rootScope.root = {
    route: 'Login',  // this corresponds to the menu item that should be active
    title: 'Login | GitSubmit'
  }

  $scope.submit = function() {
    // alert($scope.username + ' ' + $scope.password)
    $http({
      method: 'POST',
      url: Consts.API_SERVER + '/login/',
      data: {
        username: $scope.username,
        password: $scope.password
      }
    }).then(function(results) {
      $localStorage.token = results.data.token
      $localStorage.username = $scope.username
      // TODO redirect to /
    }, function(results) {
      $scope.login_status = results.data.error
    })
  }
})

app.controller('SignupCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
  $rootScope.root = {
    route: 'Sign Up',  // this corresponds to the menu item that should be active
    title: 'Sign Up | GitSubmit'
  }
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

  // formStatus: 'ready', 'submitting', 'failure'
  $scope.formStatus = 'ready'

  $scope.formSubmit = function(isValid) {
    if (!isValid) return

    $scope.formStatus = 'submitting'

    // TODO
    var url = '';
    $http.post(url, {
      class_name: $scope.class_name,
      url_name: $scope.class_id,
      description: $scope.class_description,
    }).then(function(response) {
      // success
      // TODO: redirect to /classes/ view
      $scope.formStatus = 'ready'
    }, function(response) {
      // error
      // TODO: notify user of error
      $scope.formStatus = 'failure'
    })
  }
})

app.controller('ProjectCreateCtrl', function($scope, $rootScope, $http, $routeParams) {
  var class_name = $routeParams.class_name

  $rootScope.root = {
    title: 'Create a Project'
  }

  $scope.formStatus = 'ready'

  // how many times user clicked submit with invalid date
  $scope.invalid_date_times = 0

  $scope.formSubmit = function(isValid) {
    if (!isValid) return

    // Note that the date picker doesn't work like regular inputs
    // so ng-required/model/$invalid don't work. We need to
    // use custom js code to validate it here.
    var date_input = $('#project_date')
    if (date_input.val() === undefined || date_input.val() === '') {
      date_input.addClass('invalid')
      $scope.invalid_date_times += 1
      if ($scope.invalid_date_times >= 3) {
        // alert only if user tried to submit 3 times with invalid date
        alert('Please pick a date!')
      }
      return
    } else {
      date_input.removeClass('invalid')
    }

    $scope.formStatus = 'submitting'

    var data = {
      project_name: $scope.project_name,
      url_name: $scope.project_id,
      description: $scope.project_description,
      team_based: $scope.project_team || false, // default false if value is undefined
      max_members: $scope.project_members || 1, // default 1 if value is undefined
      due_date: $('#project_date').val()
    }

    var url = ''

    $http.post(url, data).then(function(response) {
      // success
      // TODO: redirect to /classes/<class>/projects/<project>
      $scope.formStatus = 'ready'
    }, function(response) {
      // error
      // TODO: notify user of error
      $scope.formStatus = 'failure'
    })

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

app.controller('SettingsCtrl', function($scope, $rootScope, $http) {
  $rootScope.root = {
    title: 'Account Settings'
  }

  $scope.keys = [
    {
      key_name: 'wut',
      key_contents: '0xDEADBEEF'
    },
    {
      key_name: 'qux',
      key_contents: '0x1337C0DE'
    },
    {
      key_name: 'A very loooooooooooooooooooooooooooooooooooong name',
      key_contents: 'A very looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong key'
    }
  ]

  $scope.deleteKey = function(index, key_name) {
    alert('deleted ' + key_name)
    $scope.keys.splice(index, 1)
    // TODO: DELETE api:/<username>/ssh_keys/<sshkey_hexstring>/
  }

  $scope.submitPassword = function(isValid) {
    if (!isValid) return
    var password = $scope.password
    var password_current = $scope.password_current
    alert('new: ' + password + ', current: ' + password_current)
    // TODO: POST api:/<username>/update_password/<temp_password_key> {new_password: <str>}
  }

  $scope.submitKey = function(isValid) {
    if (!isValid) return
    var key_name = $scope.ssh_key_name
    var key_content = $scope.ssh_key_content
    alert('name: ' + key_name + ', content: ' + key_content)
    // TODO: POST api:/<username>/ssh_keys/ {key_name: <str>, key_contents: <str>}
  }


  $(document).ready(function() {
    $('#sidenav-overlay').trigger('click');
    $('ul.tabs').tabs()
    $('input[length]').characterCounter()
    $('.modal-trigger').leanModal()
  })

  $scope.name = 'previous name'
  $scope.email = 'previous email'

  $scope.change_name = function(){
       alert($scope.username)
       // TODO:hook up to changing username
  }

  $scope.change_email = function(){
       alert($scope.email)
       // TODO:hook up to changing email
  }
})

app.controller('SignupFormCtrl', function($scope, $http) {
  $scope.submit = function() {
    alert($scope.email + ' ' + $scope.username + ' ' + $scope.password)
  }
})

app.controller('FileBrowseCtrl', function($scope, $rootScope, $http, $routeParams, escapeHtml) {
  var class_name = $routeParams.class_name,
      project_name = $routeParams.project_name,
      commit = $routeParams.commit,
      file_path = $routeParams.file_path

  // parse file path into multiple clickable parts
  $scope.file_path_tokens = []
  var tokens = file_path.split('/').filter(function(token) { return token.length > 0 })

  var path_prefix = '/#/classes/' + class_name + '/projects/' + project_name + '/source/' + commit + '/'

  for (var i = 0; i < tokens.length; i++) {
    $scope.file_path_tokens.push({
      path: path_prefix + tokens.slice(0, i + 1).join('/'),
      name: tokens[i]
    })
  }

  // TODO: change API url here

  $http.get('/' + file_path).then(function(results) {
    // success
    // TODO: extension might not correspond to prism classes. See http://prismjs.com/index.html#languages-list
    var extension = file_path.substr(file_path.lastIndexOf('.') + 1, file_path.length)
    $('#browser-content').html(escapeHtml(results.data))
    $('#browser').addClass('language-' + extension)
    Prism.highlightAll()
  }, function(results) {
    // failure
  })
})