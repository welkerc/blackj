<html>
<head>
<title>sb</title>
</head>
<body>
<p>
<?php
    $deckArr = array(2,3,4,5,6,7,8,9,10);
    $suitArr = array('Hearts', 'Clubs', 'Dimonds', 'Spades');
    $deck1 = $deckArr[rand(0, 8)];
    $suit1 = $suitArr[rand(0, 3)];
    $deck2 = $deckArr[rand(0, 8)];
    $suit2 = $suitArr[rand(0, 3)];
    $tp = $deck1 + $deck2;
    
    echo 'You have the ' . $deck1 . ' of ' . $suit1 . ' and ' . $deck2 . ' of ' . $suit2 . '.' . "<br /><br />";
    
    echo  'You have ' . $tp;ß

    ?>
</p>
</body>
</html>