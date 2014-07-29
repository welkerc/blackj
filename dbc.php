<html>
<head>
<title>sb</title>
</head>
<body>
<p>
<?php

    $db = mysqli_connect("mysql.chriswelker.net", "cwelker", "minemine", "chriswelker_net");


    /* check connection */
    #if ($mysqli->connect_errno) {
    #   die("Connect failed: %s\n", $mysqli->connect_error);
    #}

    $q = "SELECT * FROM blackj";
    $r = mysqli_query($db,$q);

    print_r($r);

    ?>
</p>
</body>
</html>
