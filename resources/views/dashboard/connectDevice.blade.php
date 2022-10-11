<!DOCTYPE html>
<html>
    <head>
        <title>Connect Device</title>

        <link href="https://fonts.googleapis.com/css?family=Lato:100,300" rel="stylesheet" type="text/css">

        <style>
            html, body {
                height: 100%;
            }

            body {
                margin: 0;
                padding: 0;
                width: 100%;
                color: #444;
                display: table;
                font-weight: 100;
                font-family: 'Lato';
            }

            .container {
                text-align: center;
                display: table-cell;
                vertical-align: middle;
            }

            .content {
                text-align: center;
                display: inline-block;
            }

            .title {
                font-size: 42px;
                margin-bottom: 40px;
                font-weight: bold;
                color: #000;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                <div class="title">{{ $message }}</div>
            </div>
        </div>
    </body>
</html>
