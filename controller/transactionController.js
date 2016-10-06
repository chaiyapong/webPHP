app.controller('TransactionController', [
	'$scope',
	'$http',
	'$translate',
	'TransactionService',
	function($scope, $http, $translate, TransactionService) {
		var _this = this;

		this.getTransactions = function(){
			TransactionService.getAllTransactions().then(
			function(result) {
				$scope.transactionList = result.records;
				console.log($scope.transactionList);
			});
		};

		_this.init = function(){
			console.log("xxx");
			_this.getTransactions();
		};

		_this.init();
	}
]);

