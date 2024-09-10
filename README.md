# Wipeout audio visualizer

A music visualizer based on the 1996 PSX racing game, Wipeout2097.

https://github.com/user-attachments/assets/e2464937-426d-4193-91b6-6bf7524f5243


Using the original game source files, the project reconstructs the data in a format that can be used by Three.js. It then recreates a scene from the game. In the background, the site listens to and processes incoming audio, and passes this along to the scene. Based on the signature of the audio, the player, opposing ships, and scenery react in real time to ambient audio.


## URL

A staging demo exists here: https://wipeout.netlify.app/

However this is **not currently usable by the public**. This is to avoid redistributing the original source files.

An demo of its current state is available here:

https://github.com/user-attachments/assets/b7cba613-a8c4-456c-af9f-5e1c944addf9



## Current status

This is very much work in progress. In its current form the source files are parsed and reconstructed, splines are created for the player and opposing ships, and audio processing occurs in a separate thread.

How the world reacts to the incoming audio remains in an early stage and consistent, reliable, or pretty behaviour shouldn't be expected.

A mechanism for decompiling the source files for use on a public website, but without sharing the original files, also needs implementing.



## Implementation details

First of all, the parsing and reconstruction of the original source files is a rewrite of the code [by PhobosLabs](https://github.com/phoboslab/wipeout) from 2014. This has been rewritten to take a more functional structure, taking advantage of modern JS features and structure, a well as to support the major rewrites and breaking changes that have happened to Three.js in the past decade. 

The scene is laid out and manipulated using React Three Fiber.

A variety of tools are used in a worker thread to handle the audio processing.



