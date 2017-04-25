
class Cue {
    constructor(message, time, duration = 4, color="#ffffff", deleted=false){
        this.message = message;
        this.time = +time;
        this.duration = +duration;
        this.color = color;
        this.id = Cue.getNextID();
        this.deleted = deleted;
    }

    static getNextID(){
        if (!this.nextID) {this.nextID = 1;}
        return this.nextID++;
    }
}

// the CueTracker keeps track of all the Cues, gets queried to determine what Cues should be displayed or removed from display at any given time
class CueTracker {
    constructor() {
    	//key=time in seconds, value=array of cues to display at that time
        this.cueTimeMapper = {};
        //key=cue id, value=cue
        this.cueRegistry = {};
        //cues currently displaying
        this.cuesDisplaying = [];
        //helps ensure cues don"t display multiple times bc of multiple timeUpdates per second
        this.lastTimeUpdate = -1;
    }

    addCue(cue){
    	const {time, id} = cue;
    	this.cueRegistry[id] = cue;
    	if (!this.cueTimeMapper[time]){
    		this.cueTimeMapper[time] = [];
    	}
    	this.cueTimeMapper[time].push(cue);
    }

    updateDisplay(time){
    	time = Math.floor(time);
    	//only update once per second
    	if (this.lastTimeUpdate === time) {return {};}
    	this.lastTimeUpdate = time;
    	const toRemove = this._removeExpiredCues(time);
    	const toDisplay = this._addCuesToDisplay(time);
    	return {toRemove, toDisplay};
    }

    deleteCue(id){
    	const toDelete = this.cueRegistry[id];
    	toDelete.deleted = true;
    	return toDelete;
    }

    seeked(){
    	const toRemove = this.cuesDisplaying;
    	this.cuesDisplaying = [];
    	this.lastTimeUpdate = -1;
    	return toRemove;
    }

    getExistingCues(){
        const cues = [];
        for (let id in this.cueRegistry){
            let currCue = this.cueRegistry[id];
            if (!currCue.deleted) cues.push(currCue);
        }
        return cues;
    }

    _removeExpiredCues(time){
    	const toRemove = [];
    	this.cuesDisplaying = this.cuesDisplaying.filter(cue => {
    		const keeper = !cue.deleted && time < (cue.time + cue.duration);
    		if (!keeper) {toRemove.push(cue);}
    		return keeper;
    	});
    	return toRemove;
    }

    _addCuesToDisplay(time){
    	let toDisplay = this.cueTimeMapper[time];
    	if (!toDisplay) {return [];}
    	toDisplay = toDisplay.filter(cue =>!cue.deleted);
    	this.cuesDisplaying.push(...toDisplay);
		return toDisplay;
    }
}
