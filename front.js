const loadingTime = 5000;
let builds = 0; // total number of build buttons
let build = 0;  // current index (0-based)

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading');
    const buildsScreen = document.getElementById('builds');

    builds = document.querySelectorAll(".builds-container button").length;
    buildsButtons = document.querySelectorAll(".builds-container button");

    loadingScreen.classList.add('current');
    buildsScreen.classList.remove('current');

    setTimeout(() => {
        // Start fade transition
        buildsScreen.classList.add('current');
        loadingScreen.classList.add('fading-out');
        loadingScreen.classList.remove('current');

        // After CSS transition completes remove helper class
        const transitionTime = 650; // slightly longer than CSS .6s
        setTimeout(() => {
            loadingScreen.classList.remove('fading-out');
        }, transitionTime);

        buildsScreen.onwheel = scrollBuilds;
    }, loadingTime);

    buildsButtons.forEach(build => {
        build.addEventListener("click", () => {
            let url = build.getAttribute('data');
            let playerData = parsePlayerData(url);
            createPlayerPage(playerData, buildsScreen);
        });
    });

    const bgMusic = new Audio('audio/wuwaBGM.mp3');
    setTimeout(() => {
        bgMusic.play();
        bgMusic.volume = 0.4;
    }, 5000);

    updateLastCommitDate();
});

const SCROLL_THROTTLE_MS = 500; // limit handling to once per interval
let lastScrollLogTime = 0;

function scrollBuilds(event) {
    const buildsScreen = document.querySelector(".builds-container");
    event.preventDefault();

    const now = performance.now();
    if (now - lastScrollLogTime < SCROLL_THROTTLE_MS) return;
    lastScrollLogTime = now;

    // Normalize deltas (in case of line/page scroll modes)
    let { deltaY, deltaX, deltaMode } = event;
    if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
        deltaY *= 16; // approx line height
        deltaX *= 16;
    } else if (deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        deltaY *= window.innerHeight;
        deltaX *= window.innerWidth;
    }

    let direction = 'none';
    if (Math.abs(deltaY) >= Math.abs(deltaX)) {
        if (deltaY > 0) direction = 'down';
        else if (deltaY < 0) direction = 'up';
    } else {
        if (deltaX > 0) direction = 'right';
        else if (deltaX < 0) direction = 'left';
    }

    const step = 350; // px per build width

    if (direction === 'down' && build < builds - 1) {
        build += 1;
    } else if (direction === 'up' && build > 0) {
        build -= 1;
    } else {
        return; // no change, abort updating position
    }

    buildsScreen.style.marginLeft = `-${build * step}px`;
}

function parsePlayerData(url) {
    characterData = []
    fetch(url).then(response => response.text()).then(data =>{
        const rawCharacters = data.split('\n').slice(1);
        rawCharacters.forEach(character =>{
            characterData.push(character.split(','));
        });
    })
}

function createPlayerPage(characterData, buildsScreen) {
    // Create a new div inside of the builds-container, and set it to current, then transition like we did with the loading screen
    // it should look like the wuwa character screen,  and the characters on the right side can be selected, but all it will do is fade the video out, and changes the text on the screen
    const contentContainer = document.querySelector('.content');
    const characterPage = document.createElement('div');
    contentContainer.appendChild(characterPage);

    characterPage.classList.add('page');

    characterPage.innerHTML = `
        <div class="playerPage">
            <nav class="left-nav">
                <button class="overall charButton active"></button>
                <button class="weapon charButton"></button>
                <button class="echoes charButton"></button>
                <button class="skills charButton"></button>
                <button class="resonance charButton"></button>
                <button class="bio charButton"></button>
            </nav>
            <nav class="right-nav"></nav>
        </div>
    `;



    // Start fade transition
    characterPage.classList.add('current');
    buildsScreen.classList.add('fading-out');
    buildsScreen.classList.remove('current');

    // After CSS transition completes remove helper class
    const transitionTime = 650;
    setTimeout(() => {
        buildsScreen.classList.remove('fading-out');
    }, transitionTime);
}

async function updateLastCommitDate() {
    try {
      const response = await fetch('https://api.github.com/repos/oop1-10/wuwabuilds/commits');
      if (!response.ok) {
        throw new Error('Failed to fetch commits');
      }
      const commits = await response.json();
      const latestCommit = commits[0]; // Get the most recent commit
      const commitDate = new Date(latestCommit.commit.author.date);
      
      // Format the date (e.g., "August 14, 2025, 10:47 PM")
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      const formattedDate = commitDate.toLocaleDateString('en-US', options);
      
      // Update the footer
      document.getElementById('last-updated').textContent = formattedDate;
    } catch (error) {
      console.error('Error fetching commit date:', error);
      document.getElementById('last-updated').textContent = 'Unable to fetch update time';
    }
}