var app = angular.module('MobileApp.Application', ['pascalprecht.translate']);

app.config(function ($translateProvider) {
  $translateProvider.translations('en', {
    TITLE: 'Hello',
    FOO: 'This is a paragraph.',
    BUTTON_LANG_EN: 'english',
    BUTTON_LANG_DE: 'german'
  });
  $translateProvider.translations('th', {
    TITLE: 'สวัสดี',
    FOO: 'นี้คือ Paragraph.',
    BUTTON_LANG_EN: 'อังกฤษ',
    BUTTON_LANG_DE: 'อังกฤษ'
  });
  $translateProvider.preferredLanguage('th');
});

app.controller('Ctrl', function ($scope, $translate) {
  $scope.changeLanguage = function (key) {
    $translate.use(key);
  };
});