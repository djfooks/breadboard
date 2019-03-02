# breadboard
Build a breadboard computer in a game format

Try it here:

https://djfooks.github.io/breadboard/

Change log:

[03-02-2019]
- Configure button is now used to toggle debugger between read and write mode.
- Read-only debuggers now don't cause an entire scene redraw everytime they change value.
- Change placing bus color by right clicking on the bus button.
- Bus colors can now be changed by selecting a bus and then clicking the configure button.
- Added a configure button.
- Added nicer sprites for buttons.

- Save the camera position.
- Switch all rendering from canvas2d to WebGL for much better performance.
- Fix for buses sometimes not connecting in the middle of wires.
- Added Pause/Break key to pause simulation and press space (or right) key to step simulation once.
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
- Added focus to text entry on components.
- Debugger is now readable in all rotations.



Other useful stuff
==================

Finding free fonts: https://fontlibrary.org
Creating a font: https://msdf-bmfont.donmccurdy.com/

https://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers
