<?php
	include '../config/connect.php';

	$result = mysql_query("SELECT * FROM transaction");
	//fetch tha data from the database
	$outp = "";
	while ($row = mysql_fetch_array($result)) {
		  if ($outp != "") {$outp .= ",";}
	      $outp .= '{"id":"'  . $row["id"] . '",';
	      $outp .= '"transationId":"'   . $row["transationId"]        . '",';
	      $outp .= '"upload1":"'   . $row["upload1"]        . '",';
	      $outp .= '"upload2":"'. $row["upload2"]     . '"}';
	 }

	 $outp ='{"records":['.$outp.']}';

	 echo $outp;

?>