// Second step: with sync + exclusive loop per track
let trackNames = ["Drum", "Chord"];
let drumNames = ["Remorse", "Vengeance", "Massacre", "Felina"];
let chordNames = ["Boy", "Uncle", "Mother", "Sister"];
let loops = [];
let n = 4; //number of alternative loops per track

let startBtn;
let pauseBtn;
let isPaused = false;
let pausedLoops = []; // Track which loops were playing when paused

// Add volume sliders
let drumVolumeSlider;
let chordVolumeSlider;

function setup() {  
  noCanvas();  
  // Set the tempo to 70 BPM
  Tone.Transport.bpm.value = 70;
  loadLoops();
  
  const controlsContainer = select('#controls-container');
  
  // Create pause button with icon but hide it initially
  pauseBtn = createButton('<i class="fas fa-pause"></i>');
  pauseBtn.parent(controlsContainer);
  pauseBtn.class('ghost-button');
  pauseBtn.mousePressed(togglePause);
  pauseBtn.style('display', 'none'); // Hide initially
  
  // Create drum controls group
  const drumGroup = createDiv('');
  drumGroup.parent(controlsContainer);
  drumGroup.class('control-group');
  
  const drumLabel = createP('Event:');
  drumLabel.parent(drumGroup);
  drumVolumeSlider = createSlider(0, 100, 60);
  drumVolumeSlider.parent(drumGroup);
  drumVolumeSlider.style('width', '200px');
  drumVolumeSlider.input(() => updateVolume(0, drumVolumeSlider.value()));
  
  // Create chord controls group
  const chordGroup = createDiv('');
  chordGroup.parent(controlsContainer);
  chordGroup.class('control-group');
  
  const chordLabel = createP('People:');
  chordLabel.parent(chordGroup);
  chordVolumeSlider = createSlider(0, 100, 50);
  chordVolumeSlider.parent(chordGroup);
  chordVolumeSlider.style('width', '200px');
  chordVolumeSlider.input(() => updateVolume(1, chordVolumeSlider.value()));
}

function draw() {
  // not drawing anything for now
}

function loadLoops() {  
  for(let i = 0; i < trackNames.length; i++){    
    loops[i] = [];
    // load n loop alternatives per track
    for(let j = 0; j < n; j++){
      let name = i === 0 ? drumNames[j] : chordNames[j];
      loops[i][j] = new Loop("Loops/" + trackNames[i] + (j+1) + ".mp3", i, j, name);
    }
    // load loop siblings (each needs to access the loops from the same track, 
    // to stop them when it's about to play - 
    // we want only one loop from each track to be playing at any given time.
    for(let j = 0; j < n; j++){
      for(let k = 0; k < n; k++){
        if(j != k){
          loops[i][j].siblings.push(loops[i][k])
        }
      }
    }
  }
}

function updateVolume(trackIndex, value) {
  // Update volume for all loops in the track
  for(let j = 0; j < n; j++) {
    loops[trackIndex][j].setVolume(value);
  }
}

function togglePause() {
  if (Tone.Transport.state === "started") {
    // Store currently playing loops before stopping
    pausedLoops = [];
    loops.forEach(track => {
      track.forEach(loop => {
        if (loop.player.state === "started" || loop.isScheduledToPlay) {
          pausedLoops.push(loop);
          if (loop.player.state === "started") {
            loop.player.stop();
            loop.stop(); // Change to white immediately
          }
        }
      });
    });
    Tone.Transport.pause(); // Use pause instead of stop
    pauseBtn.html('<i class="fas fa-play"></i>');
  } else {
    // Resume transport and previously playing loops
    Tone.Transport.start();
    pausedLoops.forEach(loop => {
      if (loop.isScheduledToPlay) {
        loop.scheduleStart(); // Reschedule if it was scheduled
      } else {
        loop.player.start();
        loop.start(); // Change to black immediately
      }
    });
    pauseBtn.html('<i class="fas fa-pause"></i>');
    pausedLoops = []; // Clear the paused loops array
  }

  // Hide pause button if no loops are playing or paused
  let anyLoopsActive = false;
  loops.forEach(track => {
    track.forEach(loop => {
      if (loop.player.state === "started" || loop.isScheduledToPlay || pausedLoops.includes(loop)) {
        anyLoopsActive = true;
      }
    });
  });
  if (!anyLoopsActive) {
    pauseBtn.style('display', 'none');
  }
}

Tone.loaded().then(function(){  
  console.log('loaded');
});
