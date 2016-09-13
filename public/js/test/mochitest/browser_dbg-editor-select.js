/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

// Tests that the editor highlights the correct location when the
// debugger pauses

// checks to see if the first breakpoint is visible
function isElementVisible(dbg, elementName) {
  const bpLine = findElement(dbg, elementName);
  const cm = findElement(dbg, "codeMirror");
  ok(isVisibleWithin(cm, bpLine), "CodeMirror is scrolled to line");
}

add_task(function* () {
  const dbg = yield initDebugger(
    "doc-scripts.html",
    "simple1.js", "simple2.js", "long.js"
  );
  const { selectors: { getSelectedSource }, getState } = dbg;
  const simple1 = findSource(dbg, "simple1.js");
  const simple2 = findSource(dbg, "simple2.js");

  // Set the initial breakpoint.
  yield addBreakpoint(dbg, simple1.id, 4);
  ok(!getSelectedSource(getState()), "No selected source");

  // Call the function that we set a breakpoint in.
  invokeInTab("main");
  yield waitForPaused(dbg);
  assertPausedLocation(dbg, simple1, 4);

  // Step through to another file and make sure it's paused in the
  // right place.
  yield stepIn(dbg);
  assertPausedLocation(dbg, simple2, 2);

  // Step back out to the initial file.
  yield stepOut(dbg);
  yield stepOut(dbg);
  assertPausedLocation(dbg, simple1, 5);
  yield resume(dbg);

  // Make sure that we can set a breakpoint on a line out of the
  // viewport, and that pausing there scrolls the editor to it.
  const longSrc = findSource(dbg, "long.js");
  yield addBreakpoint(dbg, longSrc.id, 66);

  invokeInTab("testModel");
  yield waitForPaused(dbg);
  assertPausedLocation(dbg, longSrc, 66);
  isElementVisible(dbg, "breakpoint");

  // Remove the current breakpoint and add another on line 16.
  yield removeBreakpoint(dbg, longSrc.id, 66);
  yield addBreakpoint(dbg, longSrc.id, 16);

  // Jump to line 16 and make sure the breakpoint is visible. We only
  // added the breakpoint so we could make sure it scrolled correctly.
  yield selectSource(dbg, longSrc.url, 16);
  isElementVisible(dbg, "highlightLine");
  yield selectSource(dbg, longSrc.url, 17);
  yield selectSource(dbg, longSrc.url, 18);
  is(findAllElements(dbg, "highlightLine").length, 1,
     "Only 1 line is highlighted");
});
