Session View (probably what we work on first) ---

Top of screen---
Gym Name (Dropdown):
This can be selected from a list of gyms loaded in DB.

Session Time (Text):
Will start at 0 and count up once the start button is hit.

Start session (Button):
Will start the session timer
Makes stop buttons visible

Stop Session Timer (Button):
Will "end" the session and submit the final update to storage for stats from the session.
Will Display the space of the "Start" button once stared.

Per Climb stats----- (equal to one "Row")
Climb Name (Text Box):
Starts with default value of "Climb x", where x is the next int incrementing.
Can be edited/typed in to add a meaningful descriptor.

Climb Grade (Dropdown):
Populated values based on the selected gym.

Climb Timer (Text):
Will start counting once the Start button is pressed.

Start Climb Timer (Button):
Begins the timer for this climb counting
Shown by default when a new climb is added to the list
Replaced by Pause button when timer is running
Replaces the pause button if pause occurs

Pause Climb Timer (Button):
Pauses the Timer for this climb
Replaces the Start button when timer is running.
Replaced by Start button once activated (timer paused)

Stop Climb Timer (Button):
Stops the Timer For this climb
Visible when timer has started (>0:00:00)
Removes the play/pause buttons and itself, as time is now "Final"

Attempts (Number - not sure if element type exists):
Starts at 1
Has a "Plus" button to increment by 1
AND ability to click directly on number and type in any new integer value
(if its a default element then "Minus" button too is fine, but ideal just click to edit and +)

Completed (Check Box):
indicates if the listed climb was finished (topped)
Per Climb (Optional/implement later) ----
Add Photo (Button):
opens popup maybe?
but basically gives option to upload a photo or capture a new photo.
(happy to do one or the other if easier to implement)

Delete Photo (Button):
Removes current file to allow a new one to be added.

At the bottom of the list ---------
Add New Climb (Button):
Creates a new row/list element at the bottom of the list with the above "Per Climb" options

Add Break (Button):
Creates a new Break Row at the bottom of the list.

Break Row ----
Break Timer (Text):
Same as Climb timer
Preferably started by default once the row is added.

Start Break (Button):
If needed/timer cant start when added.
Will Pause any running Climb timer.

End Break (Button):
Will stop the break timer
Replaces the Start Break button when timer is running.
If previous Climb has a paused, NOT stopped timer, then resume this timer assuming same climb will be continued.
