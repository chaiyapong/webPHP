<?php

include '../config/connect.php';

// echo "invalid parameter";
$cust_numb = $_POST['custNumb'];
$pass_word = $_POST['pswd'];

if($cust_numb == "" || $pass_word == ""){
	$cust_numb = "123456";
	$pass_word = "123456";
}

if($cust_numb != "" || $pass_word != ""){

	$result = mysql_query("SELECT * FROM member WHERE user_code = '".$cust_numb."' AND user_pasw = '".$pass_word."'");
	$result_parm = mysql_query("SELECT dfpm_str FROM dfpm WHERE dfpm_code = 'GNRL_USER_TYPE'");
	
	// $result = $conn->query($sql);
	$num_rows = mysql_num_rows($result);
	$num_rows_parm = mysql_num_rows($result_parm);

	$row = mysql_fetch_array($result);
	$row_parm = mysql_fetch_array($result_parm);
	
	// echo "dfpm_srt = '" .$row_parm["dfpm_str"]. "'</br>";
	// echo "num_rows = '" .$num_rows. "'</br>";
	// echo "num_rows_parm = '" .$num_rows_parm. "'</br></br>";

	if ( $num_rows > 0 and $num_rows_parm > 0 ){
		if ( $row["user_type"] == $row_parm["dfpm_str"] ){
			// echo "User type is General User.";
			header('Location: ../view/uploadpic.html');
		}else{
			// echo "User type is Administrator User.";
			header('Location: ../view/managepage.html');
		}
	}
	else{
		if ( $num_rows_parm < 1 ){
			echo "Invalid default parameter value.";
		}else{
			echo "Invalid user or password.";			
		}
	}
	mysql_close();
} else {
	echo "Invalid user or password.";
}
 ?>