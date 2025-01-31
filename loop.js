// -------------------------
// Loop Class Definition
// -------------------------
class Loop {
    // Static property to track grid reference time
    static gridStartTime = null;

    constructor(url, i, j, name) {
      // Create the player with looping enabled
      this.player = new Tone.Player({
        url: url,
        loop: true
      });
      // Add volume control
      this.volume = new Tone.Volume(-20);
      // Chain: Player -> Volume -> Destination
      this.player.chain(this.volume, Tone.Destination);
      
      // Number of bars for each loop
      this.loopBars = 4;
      this.siblings = []; // other loops in the same group
      this.trackIndex = i; // e.g., 0 for drums, 1 for chords
      this.currentVolume = -20; // current volume level
    
      // Create a button for the loop
      this.button = createButton(name);
      this.button.mousePressed(this.toggle.bind(this));
      this.button.style('width', '100px');
      this.button.style('height', '60px');
      // Place the button in the appropriate container based on track index
      const container = select(i === 0 ? '#drum-loops' : '#chord-loops');
      if (container) {
        this.button.parent(container);
      }
      this.button.class('loop-button');
      // Set initial color state
      this.button.style('background-color', 'white');
      this.button.style('color', 'black');
    
      // Use separate scheduling handles for start and stop
      this.scheduledStartEvent = null;
      this.scheduledStopEvent = null;
    
      // Flag to track scheduled start
      this.isScheduledToPlay = false; 
      // Flag for previous playback state
      this.wasPlaying = false; 
    }
    
    // Called when the loop's button is pressed
    toggle() {
      console.log(`Toggling loop: ${this.button.html()}`);
      
      // If currently playing, schedule it to stop
      if (this.player.state === "started") {
        console.log("Loop is playing, scheduling stop.");
        this.scheduleStop();
      }
      // Otherwise, schedule it to start
      else {
        // If this is the first ever click, set up the grid reference
        if (Loop.gridStartTime === null) {
          Tone.start();
          Tone.Transport.start();
          Loop.gridStartTime = Tone.now();
          // Start immediately for the first loop
          this.player.start();
          this.start();
        } else {
          // For subsequent loops, schedule according to the grid
          if (Tone.Transport.state !== "started") {
            Tone.start();
            Tone.Transport.start();
          }
          this.scheduleStart();
        }
        // Show pause button
        pauseBtn.style('display', 'inline-block');
      }
    }
    
    // Update the button to the "playing" state
    start() {
      this.button.style('background-color', 'black');
      this.button.style('color', 'white');
      this.button.removeClass('scheduled');
      this.state = this.player.state;
    }
    
    // Update the button to a stopped state
    stop() {
      this.button.style('background-color', 'white');
      this.button.style('color', 'black');
      this.button.removeClass('scheduled');
      this.state = this.player.state;
      if (this.player.state === "started") {
        this.player.stop();
      }
    }

    // Show scheduled state
    showScheduled() {
      this.button.addClass('scheduled');
    }
    
    // Schedule the loop to start at the next 4-bar boundary
    scheduleStart() {
      // Show scheduled state immediately for this block only
      this.showScheduled();
      this.isScheduledToPlay = true;
      
      // Calculate time since grid start
      const timeSinceStart = Tone.now() - Loop.gridStartTime;
      const secondsPerBar = (60 / Tone.Transport.bpm.value) * 4;
      const barsElapsed = timeSinceStart / secondsPerBar;
      const nextBarBoundary = Math.ceil(barsElapsed / this.loopBars) * this.loopBars;
      const startDelay = (nextBarBoundary * secondsPerBar) - timeSinceStart;
      
      // Stop any siblings that are currently playing or scheduled
      for (const sibling of this.siblings) {
        // Cancel any scheduled starts
        if (sibling.isScheduledToPlay) {
          sibling.isScheduledToPlay = false;
          sibling.button.removeClass('scheduled');
        }
        // Stop currently playing siblings
        if (sibling.player.state === 'started') {
          sibling.player.stop("+" + startDelay);
          Tone.Draw.schedule(() => {
            sibling.stop();
            // Reset sibling button color to default
            sibling.button.removeClass('scheduled');
          }, "+" + startDelay);
        }
      }
      
      // Schedule this block to start at exactly the same time
      this.player.start("+" + startDelay);
      Tone.Draw.schedule(() => {
        this.start();
        this.isScheduledToPlay = false;
      }, "+" + startDelay);
    }
    
    // Schedule the loop to stop at the next 4-bar boundary
    scheduleStop() {
      // Show scheduled state immediately
      this.showScheduled();
      this.isScheduledToPlay = false;
      
      // Calculate time since grid start
      const timeSinceStart = Tone.now() - Loop.gridStartTime;
      const secondsPerBar = (60 / Tone.Transport.bpm.value) * 4;
      const barsElapsed = timeSinceStart / secondsPerBar;
      const nextBarBoundary = Math.ceil(barsElapsed / this.loopBars) * this.loopBars;
      const stopDelay = (nextBarBoundary * secondsPerBar) - timeSinceStart;
      
      // Schedule the audio and visual changes
      this.player.stop("+" + stopDelay);
      Tone.Draw.schedule(() => {
        this.stop();
      }, "+" + stopDelay);
    }
    
    // Cancel a pending start event
    cancelScheduledStart() {
      if (this.scheduledStartEvent !== null) {
        Tone.Transport.clear(this.scheduledStartEvent);
        this.scheduledStartEvent = null;
        this.isScheduledToPlay = false;
        this.stop();
      }
    }
    
    // Cancel a pending stop event
    cancelScheduledStop() {
      if (this.scheduledStopEvent !== null) {
        Tone.Transport.clear(this.scheduledStopEvent);
        this.scheduledStopEvent = null;
      }
    }
    
    // Adjust the volume based on an input value (0–100)
    setVolume(value) {
      // Map 0-100 to -60-0 dB
      this.currentVolume = -60 + (value * 0.6);
      if (this.volume) {
        this.volume.volume.value = this.currentVolume;
      }
    }
  }
  
  // -------------------------
  // Sample Usage & Sibling Assignment
  // -------------------------
  
  // p5.js setup function
  function setup() {
    noCanvas(); // if you’re not using a canvas, just for UI
    
    // Ensure containers exist (or create them)
    if (!select('#drum-loops')) {
      createDiv().id('drum-loops').html("<h3>Drum Loops</h3>");
    }
    if (!select('#chord-loops')) {
      createDiv().id('chord-loops').html("<h3>Chord Loops</h3>");
    }
    
    // Define URLs for your audio samples (update with valid paths)
    const drumLoopUrl = 'assets/drum-loop.mp3';   // replace with your drum loop URL
    const chordLoopUrl = 'assets/chord-loop.mp3';   // replace with your chord loop URL
    
    // Create loop instances
    const drumLoop = new Loop(drumLoopUrl, 0, 0, "Drums");
    const chordLoop = new Loop(chordLoopUrl, 1, 0, "Chords");
    
    // Store loops in an array for sibling assignment
    const loops = [drumLoop, chordLoop];
    
    // Assign each loop’s siblings to be the other loops
    loops.forEach(loop => {
      loop.siblings = loops.filter(other => other !== loop);
    });
    
    // (Optional) You can also add more loops and assign siblings similarly.
  }