# Story Engine viewer

A small React app for viewing archived data of Ryan North's long-defunct Story Engine.

The data is not included, but one can obtain it from Wayback Machine using a provided Python script.

## Getting the data

Run the script:

```bash
$ python py_scripts/rip_web_archive.py < py_scripts/archived_urls.json > public/story_engine.json
```

It will take a few hours to complete.

## Running the app (local)

Assuming you have Node.js >= 20:

```bash
$ npm install
$ npm run dev
```

It will start the app at http://localhost:5173/.

## Using the app

The app should be mostly self-explanatory. At each node you have from 0 to 5 choices that progress the story, and (except the first node) an option to undo, which returns you to the previous node.

The choices are in a different color after they've been visited, and they get a check mark after they've been exhausted (every path from them has been visited).

Some choices are disabled and displayed in grey. This is because some nodes have not been created (or at least archived) before the engine was shut down. There are many nodes where all choices are disabled and the only available option is to undo. There are a few cases where a node was not archived, but some of the following ones were. In such cases the node is available, but it has dummy text and choices.

The visited nodes are stored in Local Storage, so you need to clear it if you want to reset your progress.
