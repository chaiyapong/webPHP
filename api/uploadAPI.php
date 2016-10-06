<?php

include '../config/connect.php';

$id_name = $_POST['idName'];
$target_pic1 = $target_dir . basename($_FILES["fileToUpload1"]["name"]);
$target_pic2 = $target_dir . basename($_FILES["fileToUpload2"]["name"]);

if($id_name != "" || $target_pic1 != "" || $target_pic1 != ""){
	$target_dir = "../myfile/";

	$uploadOk = 1;
	$imageFileType1 = pathinfo($target_pic1,PATHINFO_EXTENSION);
	$imageFileType2 = pathinfo($target_pic2,PATHINFO_EXTENSION);

	$fileName1 = $id_name."_1.".$imageFileType1;
	$fileName2 = $id_name."_2.".$imageFileType1;

	$target_file1 = $target_dir.$fileName1;
	$target_file2 = $target_dir.$fileName2;

	// Check if image file is a actual image or fake image
	if(isset($_POST["submit"])) {
	    $check1 = getimagesize($_FILES["fileToUpload1"]["tmp_name"]);
	    $check2 = getimagesize($_FILES["fileToUpload2"]["tmp_name"]);
	    if($check1 !== false || $check2 !== false) {
	        echo "File is an image - " . $check["mime"] . ".";
	        $uploadOk = 1;
	    } else {
	        echo "File is not an image.";
	        $uploadOk = 0;
	    }
	}
	// Check if file already exists
	if (file_exists($target_file1) || file_exists($target_file2)) {
	    echo "Sorry, file already exists.";
	    $uploadOk = 0;
	}
	// Check file size
	if ($_FILES["fileToUpload1"]["size"] > 500000  || $_FILES["fileToUpload1"]["size"] > 500000) {
	    echo "Sorry, your file is too large.";
	    $uploadOk = 0;
	}
	// Allow certain file formats
	if($imageFileType1 != "jpg" && $imageFileType1 != "png" && $imageFileType1 != "jpeg"
	&& $imageFileType1 != "gif" && $imageFileType2 != "jpg" && $imageFileType2 != "png"
	&& $imageFileType2 != "jpeg"
	&& $imageFileType2 != "gif") {
	    echo "Sorry, only JPG, JPEG, PNG & GIF files are allowed.";
	    $uploadOk = 0;
	}
	// Check if $uploadOk is set to 0 by an error
	if ($uploadOk == 0) {
	    echo "Sorry, your file was not uploaded.";
	// if everything is ok, try to upload file
	} else {
	    if (move_uploaded_file($_FILES["fileToUpload1"]["tmp_name"], $target_file1) && move_uploaded_file($_FILES["fileToUpload2"]["tmp_name"], $target_file2)) {
	    	$sql = "insert into transaction
		        (id, transationId, upload1, upload2)
	             values (0,'".$id_name."','".$fileName1."','".$fileName2."')";

			$result=mysql_query($sql);

			echo "upload success full";
	    } else {
	        echo "Sorry, there was an error uploading your file1.";
	    }
	}
} else {
	echo "invalid parameter";
}
 ?>