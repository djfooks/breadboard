# breadboard
Build a breadboard computer in a game format

Try it here:

https://cdn.rawgit.com/djfooks/breadboard/master/index.html

Known issues:
- Lock up after deleting a component while dragging it.
- Crash after a delete/selection results in a mouseDownComponent=null on a onComponentMouseUp call.
- Create a switch and a wire then drag and delete is while dragging. Then select another component to get crash.
- Rotation without dragging causes a crash.

Change log:

- Added focus to text entry on components.
- Debugger is now readable in all rotations.
- Added Ctrl-c and Ctrl-v to copy paste selection.
- Added backspace/delete key to remove selection.
- Added multi component selection movement and rotation with shift click to add/remove from selection.
- Added a latch component. Allows memory and counters without having to deal with tricky timing issues.
- Added buses! Wires that can carry multiple signals. They also allow communication over long distances instantly.
- Increase the breadboard size 20x.
- Save debugger type.
- Wires can now be overlapped.
