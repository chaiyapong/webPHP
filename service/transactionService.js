app.service('TransactionService', function($http, $q){
    this.getAllTransactions = function() {
    	var defered = $q.defer();
    	$http.get("http://localhost/mobileApp/api/transactionAPI.php")
		.success(function (result) {
			 defered.resolve(result);
		});
        return defered.promise;
    };
 });