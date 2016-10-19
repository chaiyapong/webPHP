<?php

include '../config/connect.php';

// echo "invalid parameter";
$cust_numb = $_POST['custNumb'];
$pass_word = $_POST['pswd'];

if($cust_numb != "" || $pass_word != ""){

	$result = mysql_query("SELECT * FROM member WHERE user_code = '".$cust_numb."' AND user_pasw = '".$pass_word."'");

	$num_rows = mysql_num_rows($result);

	echo "upload success full " .$num_rows. "";

} else {
	echo "invalid parameter";
}
 ?>