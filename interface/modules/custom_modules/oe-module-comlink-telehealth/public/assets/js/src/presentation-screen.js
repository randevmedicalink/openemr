export class PresentationScreen
{
    /**
     *
     * @type HTMLVideoElement
     */
    videoElement = null;
    callerSlot = null;

    constructor(domNodeId)
    {
        /**
         *
         * @type HTMLVideoElement
         */
        this.videoElement = document.getElementById(domNodeId);
        if (!this.videoElement) {
            throw new Error("Failed to find presentation screen dom node with id " + domNodeId);
        }
    }

    updateCallerSlotScreen() {
        if (this.callerSlot && this.callerSlot.getCurrentCallStream() != null) {
            this.videoElement.srcObject = this.callerSlot.getCurrentCallStream();
            this.videoElement.play(); // TODO: do we need this?
        }
    }

    attach(callerSlot) {
        this.detach();
        if (callerSlot && callerSlot.getCurrentCallStream() != null) {
            this.videoElement.srcObject = callerSlot.getCurrentCallStream();
            this.videoElement.play();
            this.callerSlot = callerSlot;
        }
    }

    getVideoElement() {
        return this.videoElement;
    }

    detach() {
        console.trace("detatch called here");
        this.callerSlot = null;
        this.videoElement.srcObject = null;
    }
}