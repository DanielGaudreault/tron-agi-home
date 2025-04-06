<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tron Lightcycle Game</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            font-family: 'Arial', sans-serif;
            color: #00ffff;
        }
        
        #start-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.8);
            z-index: 100;
        }
        
        #game-ui {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 20px;
            box-sizing: border-box;
            display: none;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10;
        }
        
        h1 {
            font-size: 3em;
            text-shadow: 0 0 10px #00ffff;
            margin-bottom: 20px;
        }
        
        input {
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #00ffff;
            color: #00ffff;
            padding: 10px 20px;
            font-size: 1.2em;
            margin-bottom: 20px;
            outline: none;
        }
        
        button {
            background: #00ffff;
            color: #000;
            border: none;
            padding: 10px 30px;
            font-size: 1.2em;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        button:hover {
            background: #ff00ff;
            box-shadow: 0 0 10px #ff00ff;
        }
        
        .ui-panel {
            display: flex;
            justify-content: space-between;
            width: 100%;
        }
        
        .player-name {
            font-size: 1.5em;
            font-weight: bold;
            text-shadow: 0 0 5px #00ffff;
        }
        
        .controls {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border: 1px solid #00ffff;
        }
    </style>
</head>
<body>
    <div id="start-screen">
        <h1>TRON LIGHTCYCLE</h1>
        <input type="text" id="player-name" placeholder="Enter your name" maxlength="12">
        <button id="start-button">START GAME</button>
    </div>
    
    <div id="game-ui">
        <div class="ui-panel">
            <div class="player-name"></div>
            <div>Position: <span id="player-position">0,0</span></div>
            <div>Players: <span id="player-count">1</span></div>
        </div>
    </div>
    
    <div class="controls">
        <p>Controls: WASD or Arrow Keys</p>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js"></script>
    <script>
        // Your existing JavaScript code goes here
        // (The complete code you provided)
    </script>
</body>
</html>
