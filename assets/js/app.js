var app = angular.module('main', ['ngRoute', 'ngStorage'])

app.constant('Consts', {
  API_RESPONSE_CACHE_EXPIRATION: 5 * 60 * 1000 * 1000,  // 5 mins
  GITHUB_API_REPO: 'https://api.github.com/repos/gitsubmit/gitsubmit.github.io/commits/master',
  API_SERVER: typeof(API_SERVER) !== 'undefined' ? API_SERVER : 'http://api.gitsubmit.com'
})

app.config(function($routeProvider, $httpProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html',
    controller: 'HomeCtrl'
  })
  .when('/about', {
    templateUrl: 'views/about.html',
    controller: 'AboutCtrl'
  })
  .when('/login', {
    templateUrl: 'views/login.html',
    controller: 'LoginCtrl'
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
  .when('/classes', {
    templateUrl: 'views/class_list.html',
    controller: 'ClassListCtrl'
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
    controller: 'ProjectCtrl'
  })
  .when('/classes/:class_name/projects/:project_name/source/:commit/:file_path*?', {
    templateUrl: 'views/project_file_browser.html',
    controller: 'ProjectFileBrowserCtrl'
  })
  .when('/:user_name/submissions/:submission_name', {
    templateUrl: 'views/submission.html',
    controller: 'ViewSubmissionCtrl'
  })
  .when('/:user_name/submissions/:submission_name/source/:commit/:file_path*?', {
    templateUrl: 'views/submission_file_browser.html',
    controller: 'SubmissionFileBrowserCtrl'
  })
  .otherwise({
    redirectTo: '/404'
  })

  $httpProvider.defaults.useXDomain = true
  // delete $httpProvider.defaults.headers.common['X-Requested-With']
  $httpProvider.interceptors.push(function ($q, $location, $localStorage) {
    return {
      'request': function (config) {
        config.headers = config.headers || {}
        if ($localStorage.token) {
          config.headers.Authorization = 'Bearer ' + $localStorage.token
        }
        return config
      },
      'responseError': function (response) {
        // if (response.status === 401 || response.status === 403) {
        //   $location.path('/')
        // }
        return $q.reject(response)
      }
    }
  })
})

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

app.run(function($rootScope, $location, $http, $localStorage, Consts, cachedGet) {
  // show menu items according to whether user is logged in or not
  var token = $localStorage.token
  $rootScope.isLoggedIn = (token !== undefined && token !== null && token !== '')
  $rootScope.current_user = $localStorage.username

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

app.controller('HomeCtrl', function($scope, $rootScope, $localStorage, $http, Consts) {
  $rootScope.root = {
    route: 'Home',  // this corresponds to the menu item that should be active
    title: 'Home | GitSubmit'
  }

  // refresh menu items when user is redirected to / after logging in/out
  var token = $localStorage.token
  $rootScope.isLoggedIn = (token !== undefined && token !== null && token !== '')


  if($rootScope.isLoggedIn) {
    $rootScope.current_user = $localStorage.username
  }

  $http({
    method: 'GET',
    url: Consts.API_SERVER + '/' + $localStorage.username + '/landing/'
  }).then(function(res) {
    var projects = res.data.projects
    projects.sort(function(a, b) {
      if (a.due < b.due) {
        return -1
      }
      if (a.due > b.due) {
        return 1
      }
      return 0
    })

    $scope.classes = res.data.classes
    $scope.projects = projects
    $scope.submissions = res.data.submissions

  }, function(res) {
    Materialize.toast(res.data ? res.data.error : 'Error loading', 4000)
  })


  $(document).ready(function() {
    // close navbar if open
    $('#sidenav-overlay').trigger('click');
    $('.parallax').parallax()
  })
})

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

app.controller('LoginCtrl', function($scope, $rootScope, $http, $localStorage, $location, Consts) {
  $rootScope.root = {
    route: 'Login',  // this corresponds to the menu item that should be active
    title: 'Login | GitSubmit'
  }

  $scope.status = 'ready'

  $scope.submit = function() {
    if ($scope.status === 'loading') return // avoid sending multiple requests at once
    $scope.status = 'loading'
    $http({
      method: 'POST',
      url: Consts.API_SERVER + '/login/',
      data: {
        username: $scope.username,
        password: $scope.password
      }
    }).then(function(results) {
      $scope.status = 'success'
      $localStorage.token = results.data.token
      $localStorage.username = $scope.username
      $location.path('/')
    }, function(results) {
      $scope.status = 'failed'
      Materialize.toast(results.data ? results.data.error : 'Error logging in', 4000)
    })
  }

  $(document).ready(function() {
    $('#sidenav-overlay').trigger('click');
  })
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

app.controller('ClassListCtrl', function($scope, $rootScope, $http, Consts) {
  $rootScope.root = {
    title: 'Classes'
  }

  $scope.class_list_status = 'loading'

  $http({
    method: 'GET',
    url: Consts.API_SERVER + '/classes/'
  }).then(function(res) {
    $scope.class_list_status = 'ready'
    $scope.classes = res.data.classes
  }, function(res) {
    $scope.class_list_status = 'ready'
    Materialize.toast(res.data ? res.data.error : 'Error getting the list of classes', 4000)
  })
})

app.controller('ClassCtrl', function($scope, $rootScope, $http, $localStorage, $routeParams, Consts) {
  var class_name = $routeParams.class_name

  $rootScope.root = {
    title: 'Class ' + class_name + ' | GitSubmit'
  }

  $scope.status = 'loading'
  $scope.current_user = $localStorage.username

  $http({
    method: 'GET',
    url: Consts.API_SERVER + '/classes/' + class_name + "/"
  }).then(function(res) {
    $scope.class = res.data.class
    $scope.status = 'ready'
  }, function(res) {
    Materialize.toast(res.data ? res.data.error : 'Error getting class', 4000)
  })

  $http({
    method: 'GET',
    url: Consts.API_SERVER + '/classes/' + class_name + "/projects/"
  }).then(function(res) {
    $scope.projects = res.data.projects
    $scope.overdue_projects = res.data.overdue_projects
    $scope.status = 'ready'

    //Materialize.toast(res.data.projects || 'um', 4000)
    //$scope.class_list_status = 'ready'
    //$scope.classes = res.data.classes
  }, function(res) {
    Materialize.toast(res.data ? res.data.error : 'Error getting class', 4000)
  })

  $scope.class_name = class_name

  $scope.removeTeacher = function(ind, key_name) {
    // TODO
  }

  $scope.enrollStudent = function() {
     // Materialize.toast('enroll student ' + $scope.current_user)
    $http({
      method: 'POST',
      url: Consts.API_SERVER + '/classes/' + $scope.class.url_name + '/student/',
      data: {
        username: $scope.current_user
      }
    }).then(function(results) {
      $scope.class.students.push($scope.current_user)
    }, function(results) {
      console.log(results.data)
      Materialize.toast(results.data ? results.data.error : 'Error enrolling student', 4000)
    })
    // TODO: DELETE api:/<username>/ssh_keys/<sshkey_hexstring>/
  }

  $scope.addTeacher = function(teacher) {
    $http({
      method: 'POST',
      url: Consts.API_SERVER + '/classes/' + $scope.class.url_name + '/teacher/',
      data: {
        username: $scope.teacher
      }
    }).then(function(results) {
      $scope.class.teachers.push($scope.teacher)
      $scope.teacher = ''
    }, function(results) {
      console.log(results.data)
      Materialize.toast(results.data ? results.data.error : 'Error adding teacher', 4000)
    })
    // TODO: DELETE api:/<username>/ssh_keys/<sshkey_hexstring>/
  }
})

app.controller('ClassCreateCtrl', function($scope, $rootScope, $http, $location, Consts) {
  $rootScope.root = {
    title: 'Create a New Class'
  }

  // formStatus: 'ready', 'submitting', 'failure'
  $scope.formStatus = 'ready'

  $scope.formSubmit = function(isValid) {
    if (!isValid) return
    if ($scope.formStatus === 'submitting') return

    $scope.formStatus = 'submitting'

    $http({
      method: 'POST',
      url: Consts.API_SERVER + '/classes/',
      data: {
        class_name: $scope.class_name,
        url_name: $scope.class_id,
        description: $scope.class_description,
      }
    }).then(function(response) {
      $scope.formStatus = 'success'
      var new_path = '/classes/' + $scope.class_id
      console.log(new_path)
      $location.path(new_path)
    }, function(response) {
      $scope.formStatus = 'failure'
      Materialize.toast(response.data ? response.data.error : 'Error submitting form', 4000)
    })
  }
})

app.controller('ProjectCtrl', function($scope, $rootScope, $http, $localStorage, $routeParams, $location, Consts) {
  var class_name = $routeParams.class_name
  var project_name = $routeParams.project_name

  $scope.current_user = $localStorage.username

  $scope.submission_status = 'ready'
  $scope.submission_button_text = "Create a new submission"

  $rootScope.root = {
    title: 'Project ' + project_name + ' | GitSubmit'
  }

  $http({
    method: 'GET',
    url: Consts.API_SERVER + '/classes/' + class_name + "/projects/" + project_name + "/"
  }).then(function(res) {
    $scope.project_description = res.data.project.description
    $scope.project_owner = res.data.project.owner
    $scope.project = res.data.project
    $scope.parent = res.data.project.parent
    $scope.url_name = res.data.project.url_name
    $scope.gitolite_url = res.data.project.gitolite_url
  }, function(res) {
    Materialize.toast(res.data ? res.data.error : 'Error getting project details', 4000)
  })


  $http({
    method: 'GET',
    url: Consts.API_SERVER + '/classes/' + class_name + "/projects/"
  }).then(function(res) {
    $scope.projects = res.data.projects
    $scope.overdue_projects = res.data.overdue_projects

    //Materialize.toast(res.data.projects || 'um', 4000)
    //$scope.class_list_status = 'ready'
    //$scope.classes = res.data.classes
  }, function(res) {
    //$scope.class_list_status = 'ready'
    Materialize.toast(res.data ? res.data.error : 'Error getting class', 4000)
  })

  // check if user already created a submission. if yes, hide the 'new submission' button
  $http({
    method: 'GET',
    url: Consts.API_SERVER + '/' + $scope.current_user + '/submissions/' + class_name + '_' + project_name + '/'
  }).then(function(res) {
    $scope.submission_present = true
  }, function(res) {
    $scope.submission_present = false
  })

  $scope.newSubmission = function() {
    // Materialize.toast("new sub for " + $scope.current_user + ": "+Consts.API_SERVER + '/classes/' + $scope.parent + '/projects/' + $scope.project.url_name + "/make_submission/" || 'Error creating submission', 4000)

    $scope.submission_status = 'submitting'
    $scope.submission_button_text = "Creating a new submission..."

    $http({
      method: 'POST',
      url: Consts.API_SERVER + '/classes/' + $scope.parent + '/projects/' + $scope.project.url_name + "/make_submission/",
      data: {
        owner: $scope.current_user
      }
    }).then(function(results) {
      // Materialize.toast("SUB CREATED YES " + $scope.current_user || 'Error creating submission', 4000)
      $scope.submission_status = 'success'
      $scope.submission_button_text = "Create a new submission"
      $location.path('/' + $scope.current_user + '/submissions/' + $scope.parent + '_' + $scope.project.url_name)
    }, function(results) {
      console.log(results.data)
      Materialize.toast(results.data ? results.data.error : 'Error creating a new submission', 4000)
      $scope.submission_status = 'error'
      $scope.submission_button_text = "Create a new submission"
    })
  }

  $scope.class_name = class_name
  $scope.file_url = $location.url() + '/source/master/'
  $scope.embed = true
})

app.controller('ProjectCreateCtrl', function($scope, $rootScope, $http, $routeParams, $location, Consts) {
  var class_name = $routeParams.class_name

  $rootScope.root = {
    title: 'Create a Project'
  }

  $scope.formStatus = 'ready'

  // how many times user clicked submit with invalid date
  $scope.invalid_date_times = 0

  $scope.formSubmit = function(isValid) {
    if (!isValid) return
    if ($scope.formStatus === 'submitting') return

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

    // reformatting date as %Y-%m-%d
    // e.g. '19 November, 2015' -> '2015-11-19'
    var due_date = $('#project_date').val()
    var due_date_fields = due_date.split(' ')
    var due_date_month = {
      'January,': '01',
      'February,': '02',
      'March,': '03',
      'April,': '04',
      'May,': '05',
      'June,': '06',
      'July,': '07',
      'August,': '08',
      'September,': '09',
      'October,': '10',
      'November,': '11',
      'December,': '12'
    }[due_date_fields[1]]
    due_date = due_date_fields[2] + '-' + due_date_month + '-' + due_date_fields[0]


    var data = {
      project_name: $scope.project_name,
      url_name: $scope.project_id,
      description: $scope.project_description,
      team_based: $scope.project_team || false, // default false if value is undefined
      max_members: $scope.project_members || 1, // default 1 if value is undefined
      due_date: due_date
    }

    $http({
      method: 'POST',
      url: Consts.API_SERVER + '/classes/' + class_name + '/projects/',
      data: data,
    }).then(function(response) {
      $scope.formStatus = 'success'
      $location.path('/classes/' + class_name + '/projects/' + $scope.project_id)
    }, function(response) {
      $scope.formStatus = 'failure'
      Materialize.toast(response.data ? response.data.error : 'Error submitting form', 4000)
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

app.controller('SettingsCtrl', function($scope, $rootScope, $http, $localStorage, $location, Consts) {
  $rootScope.root = {
    title: 'Account Settings'
  }

  $scope.submit_key_status = 'ready'
  $scope.key_button_text = 'Add Key'

  $scope.getKeys = function() {
    $http({
      method: 'GET',
      url: Consts.API_SERVER + '/' + $localStorage.username + '/ssh_keys/',
    }).then(function(results) {
      $scope.keys = results.data.keys
    }, function(results) {

    })
  }

  $scope.getKeys()

  $scope.deleteKey = function(index, key_name) {
    // alert('deleted ' + key_name)
    $http({
      method: 'DELETE',
      url: Consts.API_SERVER + '/' + $localStorage.username + '/ssh_keys/',
      data: {
        pkey: $scope.keys[index]
      }
    }).then(function(results) {
      $scope.keys.splice(index, 1)
    }, function(results) {
      console.log(results.data)
      Materialize.toast(results.data ? results.data.error : 'Failed to delete', 4000)
    })
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

    $scope.submit_key_status = 'submitting'
    $scope.key_button_text = 'Verifying and submitting key...'
    if (!isValid) return
    var key_content = $scope.ssh_key_content
    $http({
      method: 'POST',
      url: Consts.API_SERVER + '/' + $localStorage.username + '/ssh_keys/',
      data: {
        pkey_contents: key_content
      }
    }).then(function(results) {
      $scope.submit_key_status = 'ready'
      $scope.key_button_text = 'Key added! Add another?'
      $scope.ssh_key_content = ""
      $scope.getKeys()  // refresh the key list
      setTimeout(function() {
        $('#add_ssh_key').closeModal()
      }, 2000)
    }, function(results) {
      $scope.key_button_text = 'Could not add key. Try again?'
      $scope.submit_key_status = 'error'
      Materialize.toast(results.data ? results.data.error : 'Error adding key', 4000)
    })
  }

  $scope.logout = function() {
    delete $localStorage.username
    delete $localStorage.token
    $location.path('/')
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

app.controller('SignupFormCtrl', function($scope, $http, $localStorage, $location, $route, Consts) {
  $scope.status = 'ready'
  $scope.submit = function() {
    if ($scope.status === 'loading') return // avoid sending multiple requests at once
    $scope.status = 'loading'
    $http({
      method: 'POST',
      url: Consts.API_SERVER + '/signup/',
      data: {
        username: $scope.username,
        password: $scope.password,
        email: $scope.email
      }
    }).then(function(results) {
      $scope.status = 'success'
      $localStorage.token = results.data.token
      $localStorage.username = $scope.username
      $scope.signup_status = 'Success!'
      $route.reload()
    }, function(results) {
      $scope.status = 'failed'
      Materialize.toast(results.data ? results.data.error : 'Error signing up', 4000)
    })
  }
})

app.controller('FileBrowserCtrl', function($scope, $rootScope, $http, $location, Consts, escapeHtml) {
  // NOTE: any scope that include this file browser scope should define
  // $scope.file_url as the url to get the file content.
  var file_url = $scope.file_url

  $scope.file_browser_status = 'loading'

  $http({
    method: 'GET',
    url: Consts.API_SERVER + file_url
  }).then(function(results) {
    $scope.file_browser_status = 'ready'
    $scope.file_type = results.headers('is_tree') === 'True' ? 'dir' : 'file'

    if ($scope.file_type === 'file') {
      var extension = file_url.substr(file_url.lastIndexOf('.') + 1, file_url.length)
      // console.log(extension)

      // translate file extension to prism language class
      var language = {
        'md': 'markup',
        'js': 'javascript',
        'sh': 'bash',
        'py': 'python',
        'rb': 'ruby'
      }[extension] || extension

      $(document).ready(function() {
        $('#browser-content').html(escapeHtml(results.data))
        $('#browser').addClass('language-' + language)
      })
      Prism.highlightAll()
    } else if ($scope.file_type === 'dir') {
      var files = results.data.files
      for (var i = 0; i < files.length; i++) {
        if ($scope.embed) {
          files[i].url = '/#' + $scope.file_url + ($scope.file_url.endsWith('/') ? '' : '/') + files[i].name
        } else {
          files[i].url = '/#' + $location.url() + ($location.url().endsWith('/') ? '' : '/') + files[i].name
        }
      }
      $scope.files = files
    }
  }, function(results) {
    // failure
    $scope.file_browser_status = 'failure'
    // Materialize.toast(results.data ? results.data.error : 'Error loading file browser', 4000)
  })
})

app.controller('ProjectFileBrowserCtrl', function($scope, $rootScope, $http, $routeParams, $location, Consts) {
  var class_name = $routeParams.class_name,
      project_name = $routeParams.project_name,
      commit = $routeParams.commit,
      file_path = $routeParams.file_path

  // export the file url to the child file browser scope
  $scope.file_url = $location.url()

  // parse file path into multiple clickable parts
  var tokens = []
  if (file_path) {
    tokens = file_path.split('/').filter(function(token) { return token.length > 0 })
  }
  var path_prefix = '/#/classes/' + class_name + '/projects/' + project_name + '/source/' + commit + '/'
  $scope.file_path_tokens = [{
    path: path_prefix,
    name: project_name
  }]

  for (var i = 0; i < tokens.length; i++) {
    $scope.file_path_tokens.push({
      path: path_prefix + tokens.slice(0, i + 1).join('/'),
      name: tokens[i]
    })
  }
})

app.controller('ViewSubmissionCtrl', function($scope, $rootScope, $routeParams, $location, $localStorage, $http, Consts) {
  var user_name = $routeParams.user_name,
      submission_name = $routeParams.submission_name

  $scope.current_user = $localStorage.username

  $rootScope.root = {
    title: 'Submission'
  }

  var error = function(res) {
    Materialize.toast(res.data ? res.data.error : 'Error getting submission', 4000)
  }

  $scope.status_class = 'loading'
  $scope.status_project = 'loading'
  $scope.admin = false 

  $http({
    method: 'GET',
    url: Consts.API_SERVER + '/' + user_name + '/submissions/' + submission_name + '/'
  }).then(function(res) {
    var submission = res.data.submission
    $scope.submission = submission
    $scope.admin = $localStorage.username === submission.owner || $localStorage.username in submission.contributors
    var class_id = submission.parent.split('/')[0]
    var project_id = submission.parent.split('/')[1]
    $scope.class_id = class_id
    $scope.project_id = project_id
    $http({
      method: 'GET',
      url: Consts.API_SERVER + '/classes/' + class_id + '/'
    }).then(function(res) {
      $scope.class = res.data.class
      $scope.status_class = 'ready'
    }, error)
    $http({
      method: 'GET',
      url: Consts.API_SERVER + '/classes/' + class_id + '/projects/' + project_id + '/'
    }).then(function(res) {
      console.log($scope.submission)
      $scope.project = res.data.project
      $scope.gitolite_url = $scope.submission.gitolite_url // export to git_clone.html include
      $scope.status_project = 'ready'
    }, error)
  }, error)

  $scope.file_url = $location.url() + '/source/master/'
  $scope.embed = true
})

app.controller('SubmissionFileBrowserCtrl', function($scope, $rootScope, $http, $localStorage, $routeParams, $location, Consts) {
    var user_name = $routeParams.user_name,
      submission_name = $routeParams.submission_name,
      commit = $routeParams.commit,
      file_path = $routeParams.file_path

  // export the file url to the child file browser scope
  $scope.file_url = $location.url()

  // parse file path into multiple clickable parts
  var tokens = []
  if (file_path) {
    tokens = file_path.split('/').filter(function(token) { return token.length > 0 })
  }
  var path_prefix = '/#/' + user_name + '/submissions/' + submission_name + '/source/' + commit + '/'
  $scope.file_path_tokens = [{
    path: path_prefix,
    name: submission_name 
  }]

  for (var i = 0; i < tokens.length; i++) {
    $scope.file_path_tokens.push({
      path: path_prefix + tokens.slice(0, i + 1).join('/'),
      name: tokens[i]
    })
  }
})

app.controller('DueDateCtrl', function($scope) {
  // NOTE: this controller relies on the exported $scope.due_date or $scope.project property
  var apply = function() {
    var due_date_str
    if ($scope.project) {
      due_date_str = $scope.project.due
    } else if ($scope.due_date) {
      due_date_str = $scope.due_date
    } else {
      return
    }

    $scope.due_date_str = due_date_str

    var due_date_str_fields = due_date_str.split('-'),
      due_date = new Date(),
      today_date = new Date()

    due_date.setFullYear(due_date_str_fields[0])
    due_date.setMonth(parseInt(due_date_str_fields[1]) - 1)
    due_date.setDate(due_date_str_fields[2])

    var diff_days = parseInt((due_date.getTime() - today_date.getTime()) / (1000 * 60 * 60 * 24))
    $scope.diff_days = diff_days <= 7 ? diff_days : undefined // don't show if the due date is more than 7 days away
  }

  $scope.$watch('project', apply)
  $scope.$watch('due_date', apply)
})

app.controller('GitCloneCtrl', function($scope) {
  // NOTE: this controller relies on the exported $scope.gitolite_url property
  var apply = function() {
    $scope.cmd = 'git clone git@api.gitsubmit.com:/' + $scope.gitolite_url

    $scope.copy = function() {
      window.prompt("Press Ctrl/Cmd + C, Enter", $scope.cmd);
    }
  }

  $scope.$watch('gitolite_url', apply)
})
