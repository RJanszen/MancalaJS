// This .bat file will make it easy to launch the JavaScript file by starting node in a command prompt
@echo off			
title NodeJS hook - Mancala	// Title
node %~dp0MancalaJS.js		// '%~dp0' current path + 'jscript.js'

echo End of program.
pause