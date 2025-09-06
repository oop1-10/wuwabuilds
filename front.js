const loadingTime = 5000;
const mediaURL = "https://gist.githubusercontent.com/oop1-10/4e4faa66d1883853650ab19aeeefc332/raw/characterToMedia.csv";
const characterIcons = {0:""}
let builds = 0; // total number of build buttons
let build = 0;  // current index (0-based)

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading');
    const buildsScreen = document.getElementById('builds');

    builds = document.querySelectorAll(".builds-container button").length;
    const buildsButtons = document.querySelectorAll(".builds-container button");

    loadingScreen.classList.add('current');
    buildsScreen.classList.remove('current');

    setTimeout(() => {
        // Start fade transition
        fade(buildsScreen, loadingScreen);

        buildsScreen.onwheel = scrollBuilds;
    }, loadingTime);

    buildsButtons.forEach(btn => {
        btn.addEventListener("click", async () => {
            try {
                const url = btn.getAttribute('data');
                const [playerData, nameToMedia] = await Promise.all([
                    parseCharacterData(url),
                    parseNameToMedia(mediaURL)
                ]);
                createPlayerPage(playerData, buildsScreen, nameToMedia);
            } catch (e) {
                console.error('Error loading character data:', e);
            }
        });
    });

    const bgMusic = new Audio('audio/wuwaBGM.mp3');
    setTimeout(() => {
        bgMusic.play();
        bgMusic.volume = 0.4;
    }, 5000);

    updateLastCommitDate();
});

const scrollThrottle = 500; // limit handling to once per interval
let lastScrollLogTime = 0;

function scrollBuilds(event) {
    const buildsScreen = document.querySelector(".builds-container");
    event.preventDefault();

    const now = performance.now();
    if (now - lastScrollLogTime < scrollThrottle) return; // fixed constant name
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

async function parseCharacterData(url) {
    const characterData = [];
    const response = await fetch(url);
    const text = await response.text();
    const rawCharacters = text.split('\n').slice(1).filter(l => l.trim().length);
    rawCharacters.forEach(line => {
        characterData.push(line.split(',').map(s => s.trim()));
    });
    return characterData;
}

async function parseNameToMedia(src) {
    const nameToMedia = {};
    const response = await fetch(src);
    const text = await response.text();
    const rawData = text.split('\n').slice(1).filter(l => l.trim().length);
    rawData.forEach(line => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 2) {
            const key = parts[0];
            nameToMedia[key] = parts.slice(1);
        }
    });
    return nameToMedia;
}

function createPlayerPage(characterData, buildsScreen, nameToMedia) {
    // Create a new div inside of the builds-container, and set it to current, then transition like we did with the loading screen
    // it should look like the wuwa character screen,  and the characters on the right side can be selected, but all it will do is fade the video out, and changes the text on the screen
    const contentContainer = document.querySelector('.content');
    const characterPage = document.createElement('div');
    contentContainer.appendChild(characterPage);
    let headerIcon = "";

    characterPage.classList.add('page');

    characterPage.innerHTML = `
        <video id="bg-video" autoplay>
            <source src="" type="video/mp4">
        </video>
        <div class="playerPage">
            <div class="header"></div>
            <nav class="left-nav">
                <button class="overall charButton active">Overall Info</button>
                <button class="weapon charButton">weapon</button>
                <button class="echoes charButton">echoes</button>
                <button class="skills charButton">skills</button>
                <button class="resonance charButton">resonance chain</button>
                <button class="bio charButton">bio</button>
            </nav>
            <div class="resonatorInfo"></div>
            <nav class="right-nav"><button class="backButton">Back to Builds</button></nav>
        </div>
    `;

    const backButton = document.querySelector(".backButton");

    backButton.addEventListener("click", () => {
        backToBuilds(characterPage, buildsScreen);
    });

    const buildNav = document.querySelector(".right-nav");
    const buildIndex = 0;
    const charName = (characterData[buildIndex] && characterData[buildIndex][0]) ? characterData[buildIndex][0] : null;
    const mediaEntry = nameToMedia[charName];

    characterData.forEach(() => {
        const characterButton = document.createElement("button");
        characterButton.classList.add("buildButton")

        characterButton.innerHTML = `
            <img src="${mediaEntry[2]}">
        `;

        buildNav.appendChild(characterButton);
    });

    const videoEl = characterPage.querySelector('#bg-video');
    const header = document.querySelector(".header");
    header.textContent = charName;

    if (charName) {
        if (mediaEntry && mediaEntry[0]) {
            // Play intro (mediaEntry[0]) once, then loop idle (mediaEntry[1])
            videoEl.loop = false;
            videoEl.src = mediaEntry[0];
            videoEl.play()

            const handleFirstEnd = () => {
                videoEl.removeEventListener('ended', handleFirstEnd);
                if (mediaEntry[1]) {
                    videoEl.src = mediaEntry[1];
                    videoEl.loop = true;
                    videoEl.play()
                } else {
                    // If no second video, just loop the first
                    videoEl.loop = true;
                    videoEl.play();
                }
            };
            videoEl.addEventListener('ended', handleFirstEnd);
        } else {
            console.warn('No media entry for character:', charName);
        }
    } else {
        console.warn('Could not determine character name for initial build.');
    }
    console.log('Video src:', videoEl.getAttribute('src'));

    // Use next frame so the browser paints the initial (opacity:0) state first
    requestAnimationFrame(() => fade(characterPage, buildsScreen));
}

function updatePlayerPage(characterData, characterPage, build) {
    
}

function backToBuilds(characterPage, buildsScreen) {
    const contentContainer = document.querySelector('.content');

    fade(buildsScreen, characterPage);

    setTimeout(() => contentContainer.removeChild(characterPage), 650);
}

function fade(pageToShow, pageToHide) {
    // Ensure starting hidden (opacity 0) then force reflow so transition will fire
    pageToShow.classList.remove('current');
    void pageToShow.offsetWidth; // force reflow
    pageToShow.classList.add('current'); // fades in
    pageToHide.classList.remove('current'); // fades out
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