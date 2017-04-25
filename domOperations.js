
// ~~~ INITIALIZE ~~~ //

const iframe = document.querySelector("iframe");
const player = new Vimeo.Player(iframe);
let playerColor;

let videoNumber = '214012765';
const QTMapper = {};

//set default value of new cue color selector to player color
player.getColor()
    .then(function(color) {
    	if (color[0] != "#") {color = "#"+color;}
    	document.querySelector("#cueColor").value = color;
		playerColor = color;
    })
    .catch(function(err){
    	console.error(err);
    })
    
//prevent adding a cue to time later than video duration
player.getDuration()
    .then(function(dur) {
        document.querySelector("#cueTime").max = dur;
    })
    .catch(function(err){
    	console.error(err);
    })


//constructor from cue.js, tracks cues
let QT = new CueTracker();
const DOMMOD = DOMMODCreator();

// ~~~ EVENT LISTENERS ~~~ //

player.on("timeupdate", function(e){
    const {toRemove, toDisplay} = QT.updateDisplay(e.seconds);
    console.log(e.seconds, toRemove, toDisplay);
    if (toRemove) {toRemove.forEach(DOMMOD.removeCue);}
    if (toDisplay) {toDisplay.forEach(DOMMOD.displayCue);}
});

player.on("seeked", function(e) {
	const toRemove = QT.seeked();
	toRemove.forEach(DOMMOD.removeCue);
});

document.querySelector('#addCueButton').onclick = function(e){
	e.preventDefault();
	DOMMOD.addCue(e.target.parentNode);
};

document.querySelector('#changeVideoButton').onclick = function(e){
	e.preventDefault();
	DOMMOD.changeVideo(e.target.parentNode);
};

// ~~~ CUE INTERACTIONS ~~~ //
console.log('play.', player);
function DOMMODCreator(){

	function displayCue(cue) {
		console.log('cue', cue);
		const newCue = elementCreator("span", null, null, cue.message);
		newCue.style.color = cue.color;
		const li = elementCreator("li", "cue", "Cue#"+cue.id);
		li.appendChild(newCue);
	    cueView.appendChild(li);
	}

	function removeCue(cue){
		const expiredCue = document.getElementById("Cue#"+cue.id);
		cueView.removeChild(expiredCue);
	}

	function deleteCue(cue, id){
		cue.parentNode.removeChild(cue);
		QT.deleteCue(id);
	}

	// ~~~ FORM INTERACTIONS ~~~ //

	function addCue(form) {
		//constructor from cue.js
	    const newCue = new Cue(
	    	form.message.value, 
	    	form.time.value, 
	    	form.duration.value, 
	    	form.color.value
	    	);
	    QT.addCue(newCue);
	    addToCueDetails(newCue);
	    clearForm(form);
	    return false;
	};

	function clearForm(form) {
	    form.message.value = "";
	    form.time.value = 0;
	    form.duration.value = 4;
	    form.color.value = playerColor;
	}

	function changeVideo(form) {
		const newVideoNumber = form.videoNumber.value;
		//reset form
		form.videoNumber.value = '';
		if (newVideoNumber === videoNumber) return;
		//remove displaying cues & details
		const toRemove = QT.seeked();
		toRemove.forEach(DOMMOD.removeCue);
		resetDetails();
		//store old tracker before pulling or creating one for new video
		QTMapper[videoNumber] = QT;
		QT = QTMapper[newVideoNumber] || new CueTracker();
		videoNumber = newVideoNumber;
		//populate details
		QT.getExistingCues().forEach(addToCueDetails);
		//change video
		iframe.src = `https://player.vimeo.com/video/${newVideoNumber}`;
	}

	// ~~~ CUE DETAIL (list of cues) INTERACTIONS ~~~ //

	function addToCueDetails(cue){	
		const newCueDetail = elementCreator("div", "cueDetail", "cueDetail#"+cue.id);
		newCueDetail.setAttribute("data-time", cue.time);

		const message = elementCreator("p", "cueMessage", null, cue.message);
		const time = elementCreator("p", "cueTime", null, secondsToClock(cue.time));
		const deleteButton = elementCreator("button", "deleteButton", null, "X");
		deleteButton.onclick = ()=>deleteCue(newCueDetail, cue.id);

		const rightSide = elementCreator("span", "flexRight");
		rightSide.appendChild(time);
		rightSide.appendChild(deleteButton);

		newCueDetail.appendChild(message);
		newCueDetail.appendChild(rightSide);

		// const cueDetails = document.getElementById("cueDetails");
		insertCue(cueDetails, newCueDetail);
	}

	function resetDetails(){
		while (cueDetails.firstChild) {
		    cueDetails.removeChild(cueDetails.firstChild);
		}
	}

	// function populateDetails(details){
	// 	details.for
	// }

	//insert the cue in the correct place in the list, chronologically
	function insertCue(cueList, cue){
		const otherCues = cueList.children;
		const cueTime = cue.dataset.time;
		for (let i = 0; i<otherCues.length; i++){
			let otherCue = otherCues[i]; 
			if (cueTime < +otherCue.dataset.time) {
				return cueList.insertBefore(cue, otherCue);
			}
		}
		cueList.appendChild(cue);
	}

	// ~~~ HELPER FUNCTIONS ~~~ //

	function elementCreator(tag, className, id, innerText){
		const element = document.createElement(tag);
		if (className) element.className = className;
		if (id) element.id = id;
		if (innerText !== undefined) element.innerText = innerText;
		return element;
	}

	//reformats seconds to 00:00 format
	//suitable for times < 60 minutes
	function secondsToClock(seconds){
		let minutes = Math.floor(seconds/60);
		minutes = ("00"+minutes).slice(-2);
		seconds = ("0"+seconds%60).slice(-2);
		return minutes + ":" + seconds;
	}

	return {
		addCue,
		removeCue,
		displayCue,
		changeVideo
	}
}