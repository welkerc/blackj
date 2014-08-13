<?php

$hn = "mysql.chriswelker.net";   // eg. mysql.yourdomain.com (unique)
$un = "cwelker";   // the username specified when setting-up the database
$pw = "minemine";   // the password specified when setting-up the database
$dbn = "chriswelker_net";   // the database name chosen when setting-up the database (unique)
$sql = "SELECT * FROM `blackj` WHERE 1 LIMIT 0, 52 ";

$db = mysql_connect($hn,$un,$pw);

?>
