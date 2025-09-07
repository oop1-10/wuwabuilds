const loadingTime = 5000;
let nameToMedia = {};
const mediaURL = "https://gist.githubusercontent.com/oop1-10/4e4faa66d1883853650ab19aeeefc332/raw/characterToMedia.csv";
let builds = 0; // total number of build buttons
let build = 0;  // current index (0-based)

document.addEventListener('DOMContentLoaded', async () => {
    await parseNameToMedia();
    console.log('Loaded nameToMedia:', nameToMedia);
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
                const characterData = await parseCharacterData(url); // FIX: await the async function
                createPlayerPage(characterData, buildsScreen);
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

    const step = 500; // px per build width

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
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP Error: " + response.status);
    const json = await response.json();

    return json;
}

async function parseNameToMedia() {
    const response = await fetch("data/characters.json");
    if (!response.ok) throw new Error("HTTP Error: " + response.status);
    const json = await response.json();

    nameToMedia = json;
}

function createPlayerPage(characterData, buildsScreen) {
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
            <nav class="left-nav">
                <div class="header"></div>
                <button class="overall charButton active">Overall Info</button>
                <button class="weapon charButton">weapon</button>
                <button class="echoes charButton">echoes</button>
                <button class="skills charButton">skills</button>
                <button class="resonance charButton">resonance chain</button>
                <button class="bio charButton">bio</button>
            </nav>
            <div class="resonatorInfo"></div>
            <nav class="right-nav"><div class="buildNav"><button class="backButton">Back to Builds</button></div></nav>
        </div>
    `;

    const backButton = document.querySelector(".backButton");
    backButton.classList.add("backButton")

    backButton.addEventListener("click", () => {
        backToBuilds(characterPage, buildsScreen);
    });

    const buildNav = document.querySelector(".buildNav");
    const charName = characterData[0].character;
    const currentCharacter = nameToMedia[charName];

    let i = 0;
    characterData.forEach(() => {
        const characterButton = document.createElement("button");
        characterButton.classList.add("buildButton");
        characterButton.setAttribute("build", i);
        characterButton.innerHTML = `<img src="${nameToMedia[characterData[i].character].icon}" style="border-radius: 100%; ">`;

        characterButton.addEventListener("click", () => {
            updatePlayerPage(characterData, characterPage, i);
        });

        buildNav.appendChild(characterButton);
        i++;
    });

    const videoEl = characterPage.querySelector('#bg-video');
    const header = document.querySelector(".header");
    header.textContent = currentCharacter.name;
    
    if (currentCharacter && currentCharacter.animation) {
        // Play intro (mediaEntry[0]) once, then loop idle (mediaEntry[1])
        videoEl.loop = false;
        videoEl.src = currentCharacter.animation;
        videoEl.play()

        const handleFirstEnd = () => {
            videoEl.removeEventListener('ended', handleFirstEnd);
            if (currentCharacter.loop) {
                videoEl.src = currentCharacter.loop;
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
        console.warn('No media entry for character:', currentCharacter.name);
    }
    
    console.log('Video src:', videoEl.getAttribute('src'));

    updatePlayerPage(characterData, characterPage, build);

    // Use next frame so the browser paints the initial (opacity:0) state first
    requestAnimationFrame(() => fade(characterPage, buildsScreen));
}

function updatePlayerPage(characterData, characterPage, build) {
    const resonatorInfo = document.querySelector(".resonatorInfo");
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