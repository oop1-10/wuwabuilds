const loadingTime = 5000;
let nameToMedia = {};
const elementIcons = {"Aero": "https://img.game8.co/3884629/f189d5cfa3359e681ba1cbfffdee62d5.png/show", "Electro": "https://img.game8.co/3884642/7c985e17b86bb9d2181b835fbafe5c45.png/show", "Fusion": "https://img.game8.co/3884628/c19736709a556f0e6320ca3578603bf7.png/show", "Glacio": "https://img.game8.co/3884631/a625f54e023f3e9d73712a291d9f6f1c.png/show", "Havoc": "https://img.game8.co/3884630/fa0b538bf3096b7a08389cb40f1bf223.png/show", "Spectro": "https://img.game8.co/3884627/ab3dabdabc17084ad6ed15107a760181.png/show"};
const characterButtonIcons = {"Overall": "images/characterbuttons/overall.png", "Weapon": "images/characterbuttons/", "Echoes": "images/characterbuttons/", "Skills": "images/characterbuttons/", "Chain": "images/characterbuttons/", "Bio": "images/characterbuttons/"};
let builds = 0; // total number of build buttons
let build = 0;  // current index (0-based)
let currentCharacterName = '';

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

    characterPage.classList.add('page');

    characterPage.innerHTML = `
        <video id="bg-video" autoplay>
            <source src="" type="video/mp4">
        </video>
        <div class="playerPage">
            <nav class="left-nav">
                <div class="header"></div>
                <button class="overall charButton"><img src="${characterButtonIcons.Overall}" alt="Overall Info"></button>
                <button class="weapon charButton"><img src="${characterButtonIcons.Weapon}" alt="Weapon"></button>
                <button class="echoes charButton"><img src="${characterButtonIcons.Echoes}" alt="Echoes"></button>
                <button class="skills charButton"><img src="${characterButtonIcons.Skills}" alt="Skills"></button>
                <button class="chain charButton"><img src="${characterButtonIcons.Chain}" alt="Resonance Chain"></button>
                <button class="bio charButton"><img src="${characterButtonIcons.Bio}" alt="Bio"></button>
            </nav>
            <div class="resonatorInfo"></div>
            <nav class="right-nav"><div class="buildNav"><button class="backButton">Back to Builds</button></div></nav>
        </div>
    `;

    const backButton = document.querySelector(".backButton");
    backButton.classList.add("backButton");

    backButton.addEventListener("click", () => {
        backToBuilds(characterPage, buildsScreen);
    });

    const buildNav = document.querySelector(".buildNav");
    const charName = characterData[0].character;
    const currentCharacter = nameToMedia[charName];
    currentCharacterName = currentCharacter;
    const buildData = characterData[0];

    let index = 0;
    characterData.forEach(() => {
        const characterButton = document.createElement("button");
        characterButton.classList.add("buildButton");
        characterButton.setAttribute("build", index);
        characterButton.innerHTML = `<img src="${nameToMedia[characterData[index].character].icon}" style="border-radius: 100%; ">`;

        characterButton.addEventListener("click", () => {
            changePlayerBuild(characterPage, characterData, characterButton.getAttribute("build"));
        });

        buildNav.appendChild(characterButton);
        index++;
    });

    const characterButtons = document.querySelectorAll(".charButton");

    // Use the index of each left-nav button as the tab id (0: overall, 1: weapon, ...)
    characterButtons.forEach((button, idx) => {
        button.style.border = "none";
        button.style.background = 'transparent';
        button.addEventListener("click", () => {
            updatePlayerPage(buildData, idx);
        });
    });

    const videoEl = characterPage.querySelector('#bg-video');
    const header = document.querySelector(".header");
    header.textContent = currentCharacter.name;
    
    if (currentCharacter && currentCharacter.animation) {
        videoEl.loop = false;
        videoEl.src = currentCharacter.animation;
        videoEl.play();

        const handleFirstEnd = () => {
            videoEl.removeEventListener('ended', handleFirstEnd);
            if (currentCharacter.loop) {
                videoEl.src = currentCharacter.loop;
                videoEl.loop = true;
                videoEl.play();
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

    updatePlayerPage( buildData, 0);

    fade(characterPage, buildsScreen);
}

function updatePlayerPage(buildData, button) {
    const resonatorInfo = document.querySelector(".resonatorInfo");
    
    switch (button) {
        case 0:
            resonatorInfo.innerHTML = `
                <div style="display: flex; flex-direction: row;">
                    <img src="${elementIcons[buildData.type]}" style="width: 100px; height: 100px; ">
                    <div>
                        <p style="margin-top: 10px; margin-bottom: 0px; ">${buildData.character}</p>
                        <p style="margin-top: 0px; margin-bottom: 0px; color: #a69661; ">${buildData.type}</p>
                    </div>
                </div>

                <p>Lv. ${buildData.level}/<span style="color: #637079; ">90</span></p>
                <hr style="width: 100%; ">
                <table style="width: 100%; ">
                    <tr >
                        <td>HP</td>
                        <td style="margin-left: 0; ">${buildData.hp}</td>
                    </tr>
                    <tr>
                        <td>ATK</td>
                        <td style="margin-left: 0; ">${buildData.atk}</td>
                    </tr>
                    <tr >
                        <td>DEF</td>
                        <td style="margin-left: 0; ">${buildData.def}</td>
                    </tr>
                    <tr>
                        <td>Energy Regen</td>
                        <td style="margin-left: 0; ">${buildData.er}</td>
                    </tr>
                    <tr >
                        <td>Crit. Rate</td>
                        <td style="margin-left: 0; ">${buildData.cr}</td>
                    </tr>
                    <tr>
                        <td>Crit. DMG</td>
                        <td style="margin-left: 0; ">${buildData.cd}</td>
                    </tr>
                </table>
            `;
            break;
        
        case 1:
            resonatorInfo.innerHTML = `
                <p>Weapon: ${buildData.weapon}</p>
            `;
            break;

        case 2:
            resonatorInfo.innerHTML = ``;
            break;

        case 3:
            resonatorInfo.innerHTML = ``;
            break;

        case 4:
            resonatorInfo.innerHTML = ``;
            break;

        case 5:
            resonatorInfo.innerHTML = ``;
            break;

        default:
            break;
    }

    resonatorInfo.style.opacity = 0;
    setTimeout(() => resonatorInfo.style.opacity = 1);
}

function changePlayerBuild(characterPage, characterData, build) {
    const buildData = characterData[build];
    const currentCharacter = nameToMedia[buildData.character];

    const videoEl = characterPage.querySelector('#bg-video');
    const header = document.querySelector(".header");
    header.textContent = currentCharacter.name;
    
    if (currentCharacter && currentCharacter.animation) {
        videoEl.loop = false;
        videoEl.src = currentCharacter.animation;
        videoEl.play();

        const handleFirstEnd = () => {
            videoEl.removeEventListener('ended', handleFirstEnd);
            if (currentCharacter.loop) {
                videoEl.src = currentCharacter.loop;
                videoEl.loop = true;
                videoEl.play();
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

    updatePlayerPage(buildData, 0);
}

function backToBuilds(characterPage, buildsScreen) {
    const contentContainer = document.querySelector('.content');

    fade(buildsScreen, characterPage);

    setTimeout(() => contentContainer.removeChild(characterPage), 650);
}

function fade(pageToShow, pageToHide) {
    pageToHide.classList.remove('current'); // fades out
    pageToShow.classList.add('current'); // fades in
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