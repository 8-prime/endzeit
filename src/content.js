function formatTime(date) {
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calculateEndTime(duration, currentTime, playbackRate) {
    const remainingTime = (duration - currentTime) / playbackRate;
    const endTime = new Date();
    endTime.setSeconds(endTime.getSeconds() + remainingTime);
    return formatTime(endTime);
}

function addYouTubeEndTimeDisplay() {
    const video = document.querySelector('video');
    if (!video) return;

    const timeDisplay = document.querySelector('.ytp-time-display');
    if (!timeDisplay) return;

    // Check if we already added the end time span
    if (timeDisplay.querySelector('.zeitsprung-end-time')) return;

    // Create new span for end time
    const endTimeSpan = document.createElement('span');
    endTimeSpan.className = 'zeitsprung-end-time';
    endTimeSpan.style.marginLeft = '10px';
    timeDisplay.appendChild(endTimeSpan);

    // Update end time whenever time or playback rate changes
    function updateEndTime() {
        const duration = video.duration;
        const currentTime = video.currentTime;
        const playbackRate = video.playbackRate;

        if (duration && !isNaN(duration)) {
            const endTime = calculateEndTime(duration, currentTime, playbackRate);
            endTimeSpan.textContent = `Ends at ${endTime}`;
        }
    }

    // Add event listeners
    video.addEventListener('timeupdate', updateEndTime);
    video.addEventListener('ratechange', updateEndTime);
    video.addEventListener('durationchange', updateEndTime);
}

function addNetflixEndTimeDisplay() {
    const video = document.querySelector('video');
    if (!video) return;

    const timeDisplay = document.querySelector('[data-uia="controls-time-remaining"]');
    if (!timeDisplay) return;

    const rect = timeDisplay.getBoundingClientRect();

    if (document.body.querySelector('.zeitsprung-end-time')) return;

    // Create new span for end time
    const endTimeSpan = document.createElement('span');
    endTimeSpan.className = 'zeitsprung-end-time';
    endTimeSpan.style.marginLeft = '10px';
    endTimeSpan.style.position = 'absolute';
    endTimeSpan.style.color = '#fff';  // Netflix uses white text
    endTimeSpan.style.fontSize = "1.6rem";
    endTimeSpan.style.textAlign = "right";
    endTimeSpan.style.width = "200px";
    endTimeSpan.style.left = `${rect.left - 150}px`;
    endTimeSpan.style.top = `${rect.top - 20}px`; // 20 pixels above
    document.body.appendChild(endTimeSpan);

    // Update end time whenever time or playback rate changes
    function updateEndTime() {
        const duration = video.duration;
        const currentTime = video.currentTime;
        const playbackRate = video.playbackRate;

        if (duration && !isNaN(duration)) {
            const endTime = calculateEndTime(duration, currentTime, playbackRate);
            endTimeSpan.textContent = `Ends at ${endTime}`;
        }
    }

    // Add event listeners
    video.addEventListener('timeupdate', updateEndTime);
    video.addEventListener('ratechange', updateEndTime);
    video.addEventListener('durationchange', updateEndTime);
}

function removeNetflixTimeDisplay() {

    const endTimeDisplay = document.querySelector(".zeitsprung-end-time");
    if (!endTimeDisplay) return;

    endTimeDisplay.remove();
}

function observeNetflixPlayerView() {
    const targetNode = document.querySelector('.watch-video--player-view');
    if (!targetNode) return;

    // Options for the observer (which mutations to observe)
    const config = {
        childList: true, // Observe direct children
        subtree: true,   // Observe all descendants
        attributes: true // Observe attribute changes
    };

    // Callback function to execute when mutations are observed
    const callback = (mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                if (document.querySelector(".inactive") || document.querySelector(".passive")) {
                    removeNetflixTimeDisplay();
                    return;
                }
                // Call the function to add the end time display
                addNetflixEndTimeDisplay();
            }
        }
    };

    // Create an instance of MutationObserver with the callback
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
}

// Initial setup
function init() {
    // Determine which platform we're on and call appropriate function
    const isYouTube = window.location.hostname.includes('youtube');
    const isNetflix = window.location.hostname.includes('netflix');

    // Wait for video player to be ready
    const observer = new MutationObserver((mutations, obs) => {
        if (document.querySelector('video')) {
            if (isYouTube) {
                addYouTubeEndTimeDisplay();
            } else if (isNetflix) {
                addNetflixEndTimeDisplay();
                observeNetflixPlayerView();
            }
            obs.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Run on page load and handle SPA navigation
init();
if (window.location.hostname.includes('youtube')) {
    window.addEventListener('yt-navigate-finish', init);
} else if (window.location.hostname.includes('netflix')) {
    // Netflix uses pushState for navigation
    let lastUrl = window.location.href;
    new MutationObserver(() => {
        const url = window.location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            init();
        }
    }).observe(document, { subtree: true, childList: true });
}