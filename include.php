<?php

$hn =    // eg. mysql.yourdomain.com (unique)
$un =    // the username specified when setting-up the database
$pw =    // the password specified when setting-up the database
$dbn =   // the database name chosen when setting-up the database (unique)
$sql = "SELECT * FROM `blackj` WHERE 1 LIMIT 0, 52 ";

$db = mysql_connect($hn,$un,$pw);

?>
