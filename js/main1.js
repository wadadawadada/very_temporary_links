document.addEventListener('DOMContentLoaded', () => {
    loadLinksFromUrl();
    loadLinks();
    checkLinkItems();

    const isMobile = window.matchMedia("only screen and (max-width: 600px)").matches;

    const currentTitle = localStorage.getItem('currentTitle');
    if (currentTitle) {
        document.getElementById('pageTitle').value = currentTitle;
        document.getElementById('titleInputContainer').classList.remove('hidden');
    }

    document.getElementById('pageTitle').addEventListener('input', function() {
        localStorage.setItem('currentTitle', this.value);
        updatePageTitleOnTabs(this.value);
    });

    loadSavedPages();

    document.getElementById('shareBtn').addEventListener('click', async function() {
        const shareBtn = this;
        const originalContent = shareBtn.innerHTML;
        shareBtn.classList.add('animated');

        const handler = async () => {
            shareBtn.removeEventListener('animationend', handler);
            const shareUrl = await shareState();
            if (shareUrl) {
                if (isMobile) {
                    const generatedLinkContainer = document.getElementById('generatedLinkContainer');
                    const generatedLinkInput = document.getElementById('generatedLink');
                    generatedLinkInput.value = shareUrl;
                    generatedLinkContainer.classList.remove('hidden');
                } else {
                    try {
                        await navigator.clipboard.writeText(shareUrl);
                        shareBtn.innerHTML = 'Copied!';
                    } catch (err) {
                        console.error('Failed to copy: ', err);
                        alert('Failed to copy the link. Please try again.');
                    } finally {
                        setTimeout(() => {
                            shareBtn.innerHTML = originalContent;
                        }, 2000);
                    }
                }
            } else {
                alert('Failed to generate share link. Please try again.');
            }
            shareBtn.classList.remove('animated');
        };

        shareBtn.addEventListener('animationend', handler);
    });

    document.getElementById('copyLinkBtn').addEventListener('click', async () => {
        const generatedLinkInput = document.getElementById('generatedLink');
        generatedLinkInput.select();
        try {
            await navigator.clipboard.writeText(generatedLinkInput.value);
            alert('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert('Failed to copy the link. Please try again.');
        }
    });

    const savedPages = JSON.parse(localStorage.getItem('savedPages')) || [];

    const infoIcon = document.querySelector('.infoInfo');
    const tooltip = infoIcon.querySelector('.tooltip');

    infoIcon.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);
    });

    infoIcon.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 500);
    });

    document.getElementById('connectWalletBtn').addEventListener('click', async () => {
        try {
            if (window.ethereum) {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const web3 = new Web3(window.ethereum);
                const accounts = await web3.eth.getAccounts();
                const walletAddress = accounts[0];

                console.log('Connected account:', walletAddress);

                document.getElementById('connectWalletBtn').classList.add('connected');
                toggleOnlineButtons(true);  // Show buttons when wallet is connected

                const shortWalletAddress = `⟠ ${walletAddress.slice(0, 3)}...${walletAddress.slice(-2)}`;
                document.getElementById('walletAddress').textContent = shortWalletAddress;

                document.getElementById('saveOnlineBtn').addEventListener('click', () => saveStateOnline(walletAddress));
                document.getElementById('loadOnlineBtn').addEventListener('click', () => loadStateOnline(walletAddress));
            } else {
                console.error('MetaMask is not installed.');
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    });

    document.getElementById('myLinksBtn').addEventListener('click', () => {
        const currentLinks = JSON.parse(localStorage.getItem('links')) || [];
        if (currentLinks.length === 0) return;

        const title = document.getElementById('pageTitle').value;
        const pageCount = savedPages.length + 1;

        const savedPage = {
            id: pageCount,
            title: title || `Page ${pageCount}`,
            links: currentLinks
        };

        savedPages.push(savedPage);
        localStorage.setItem('savedPages', JSON.stringify(savedPages));

        createSavedPageElement(savedPage.id, savedPage.title);

        localStorage.removeItem('links');
        localStorage.removeItem('currentTitle');
        document.getElementById('pageTitle').value = '';
        loadLinks();
    });

    document.querySelectorAll('.imgContainer').forEach(container => {
        enableDrawing(container);
    });

    const toggleDirectionBtn = document.getElementById('toggleDirectionBtn');
    const linkList = document.getElementById('linkList');
    let isGrid = true;

    toggleDirectionBtn.addEventListener('click', () => {
        linkList.classList.toggle('grid-layout', isGrid);
        linkList.classList.toggle('column-layout', !isGrid);
        isGrid = !isGrid;
    });

    toggleOnlineButtons(false);  // Hide buttons on page load

    // Chat button and modal functionality
    const chatButton = document.getElementById('chatButton');
    const chatModal = document.getElementById('chatModal');
    const closeChatModal = document.getElementById('closeChatModal');
    const chatIframeContainer = document.getElementById('chatIframeContainer');

    chatButton.addEventListener('click', async () => {
        const hash = getUrlParameter('state');
        if (hash) {
            const chatUrl = `https://m00nchat.netlify.app/?id=${hash}`;
            chatIframeContainer.innerHTML = `<iframe src="${chatUrl}" class="chat-modal-main"></iframe>`;
            chatModal.classList.remove('hidden');
        } else {
            alert('No state hash found in the URL.');
        }
    });

    closeChatModal.addEventListener('click', () => {
        chatModal.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target === chatModal) {
            chatModal.classList.add('hidden');
        }
    });
});

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

async function shareState() {
    const pinataApiKey = '9b2c19fe686b4a404823';
    const pinataSecretApiKey = '8e44607ecd28a80789d38d79b99a8c4f6169b1d1d46a3dc2662dc3adfd982015';
    const currentState = {
        links: JSON.parse(localStorage.getItem('links')) || [],
        title: localStorage.getItem('currentTitle') || '',
        drawings: {},
        savedPages: JSON.parse(localStorage.getItem('savedPages')) || [],
        comments: {}
    };

    document.querySelectorAll('.imgContainer img').forEach(img => {
        const drawingData = localStorage.getItem(`drawing-data-${img.src}`);
        if (drawingData) {
            currentState.drawings[img.src] = JSON.parse(drawingData);
        }
    });

    document.querySelectorAll('.linkItem').forEach(item => {
        const url = item.querySelector('a').href;
        const comment = localStorage.getItem(`comment-${url}`);
        if (comment) {
            currentState.comments[url] = comment;
        }
    });

    const json = JSON.stringify(currentState);

    const formData = new FormData();
    formData.append('file', new Blob([json], { type: 'application/json' }), `state.json`);

    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const headers = {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        const data = await response.json();
        if (data.IpfsHash) {
            const shareUrl = `${window.location.origin}${window.location.pathname}?state=${data.IpfsHash}`;
            await navigator.clipboard.writeText(shareUrl);
            return shareUrl;
        } else {
            throw new Error('Failed to save state to Pinata');
        }
    } catch (error) {
        console.error('Error saving state to Pinata:', error);
        return null;
    }
}

function updatePageTitleOnTabs(title) {
    const savedPages = JSON.parse(localStorage.getItem('savedPages')) || [];
    const activePage = document.querySelector('.savedPage.active');
    if (activePage) {
        const activePageId = parseInt(activePage.getAttribute('data-id'));
        savedPages.forEach(page => {
            if (page.id === activePageId) {
                page.title = title;
            }
        });
        localStorage.setItem('savedPages', JSON.stringify(savedPages));
        loadSavedPages();
    }
}

function loadSavedPages() {
    const savedPages = JSON.parse(localStorage.getItem('savedPages')) || [];
    const savedPagesContainer = document.getElementById('savedPagesContainer');
    savedPagesContainer.innerHTML = '';
    savedPages.forEach(page => createSavedPageElement(page.id, page.title));
}

function createSavedPageElement(id, title) {
    const savedPageElement = document.createElement('div');
    savedPageElement.className = 'savedPage';
    savedPageElement.setAttribute('data-id', id);

    const pageTitle = document.createElement('div');
    pageTitle.className = 'savedPageTitle';
    pageTitle.textContent = title || `Page ${id}`;

    savedPageElement.appendChild(pageTitle);

    const colorClass = `color${(id % 6) + 1}`;
    savedPageElement.classList.add(colorClass);

    const deleteTabBtn = document.createElement('button');
    deleteTabBtn.className = 'delete-tab-btn';
    deleteTabBtn.textContent = 'X';
    deleteTabBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteSavedPage(id);
    });
    savedPageElement.appendChild(deleteTabBtn);

    savedPageElement.addEventListener('click', () => {
        document.querySelectorAll('.savedPage').forEach(page => page.classList.remove('active'));
        savedPageElement.classList.add('active');

        const savedPages = JSON.parse(localStorage.getItem('savedPages')) || [];
        const page = savedPages.find(page => page.id === id);
        if (page) {
            localStorage.setItem('links', JSON.stringify(page.links));
            localStorage.setItem('currentTitle', page.title);
            document.getElementById('pageTitle').value = page.title;
            loadLinks();
        }
    });

    document.getElementById('savedPagesContainer').appendChild(savedPageElement);
}

function deleteSavedPage(id) {
    let savedPages = JSON.parse(localStorage.getItem('savedPages')) || [];
    savedPages = savedPages.filter(page => page.id !== id);
    savedPages.forEach((page, index) => {
        page.id = index + 1;
    });
    localStorage.setItem('savedPages', JSON.stringify(savedPages));
    loadSavedPages();
    checkLinkItems();
}

function toggleOnlineButtons(show) {
    const onlineButtonsContainer = document.getElementById('onlineButtonsContainer');
    const saveOnlineBtn = document.getElementById('saveOnlineBtn');
    const loadOnlineBtn = document.getElementById('loadOnlineBtn');
    
    if (show) {
        onlineButtonsContainer.classList.remove('hidden');
        saveOnlineBtn.classList.remove('hidden');
        loadOnlineBtn.classList.remove('hidden');
    } else {
        onlineButtonsContainer.classList.add('hidden');
        saveOnlineBtn.classList.add('hidden');
        loadOnlineBtn.classList.add('hidden');
    }
}
