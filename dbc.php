<?php

$hn = "mysql.chriswelker.net";   // eg. mysql.yourdomain.com (unique)
$un = "cwelker";   // the username specified when setting-up the database
$pw = "minemine";   // the password specified when setting-up the database
$dbn = "chriswelker_net";   // the database name chosen when setting-up the database (unique)
$sql = "SELECT * FROM `blackj` WHERE 1 LIMIT 0, 52 ";

$db = mysql_connect($hn,$un,$pw);

mysql_select_db($dbn) or die("Unable to select database");

$result = mysql_query($sql, $db) or die("Unable to select: ".mysql_error());
print "<table>\n";
while($row = mysql_fetch_row($result)) {
    print "<tr>\n";
    foreach($row as $field) {
        print "<td>$field</td>\n";
    }
    print "</tr>\n";
}
print "</table>\n";
mysql_close($link);
?>
