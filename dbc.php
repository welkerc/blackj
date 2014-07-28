<html>
<head>
<title>sb</title>
</head>
<body>
<p>
<?php   
   
    $mysqli = new mysqli("mysql.chriswelker.net", "cwelker", "minemine", "chriswelker_net");
    
    /* check connection */
    #if ($mysqli->connect_errno) {
    #   die("Connect failed: %s\n", $mysqli->connect_error);
    #}
    
    $q = "SELECT * FROM blackj";
    $r = $mysqli->query($q);
    
    $r = $result->fetch_array(mysqli_assoc);
    printf ("%s ($s)\n", $row[0], $row["rank"]);
   
    ?>
</p>
</body>
</html>
