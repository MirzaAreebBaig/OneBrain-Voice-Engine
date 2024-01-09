<?php
$hostname = 'localhost';
$username = 'dbuser';
$password = 'dbpassword';
$database = 'dbname';
$mysqli = new mysqli($hostname, $username, $password, $database);
if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}
$query = "SELECT * FROM attendance";
$result = $mysqli->query($query);
$rows = $result->fetch_all(MYSQLI_ASSOC);
$jsonResult = json_encode($rows, JSON_PRETTY_PRINT);
header('Content-Type: application/json');
echo $jsonResult;
$mysqli->close();
?>

