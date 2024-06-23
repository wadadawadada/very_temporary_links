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
            const currentLinks = JSON.parse(localStorage.getItem('links')) || [];
            const linksParam = encodeURIComponent(JSON.stringify(currentLinks));
            const longUrl = `${window.location.origin}${window.location.pathname}?links=${linksParam}`;
            const response = await fetch(`https://api.tinyurl.com/create?api_token=9XhspWrHEHf7ieo1IlDpHEnjOAieV09pD5icaG6WWxuaolrsEEywKab0qL0n`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: longUrl,
                    domain: "tinyurl.com"
                })
            });
            const data = await response.json();
            if (data.data) {
                const shortUrl = data.data.tiny_url;
                if (isMobile) {
                    const generatedLinkContainer = document.getElementById('generatedLinkContainer');
                    const generatedLinkInput = document.getElementById('generatedLink');
                    generatedLinkInput.value = shortUrl;
                    generatedLinkContainer.classList.remove('hidden');
                } else {
                    await navigator.clipboard.writeText(shortUrl);
                    shareBtn.innerHTML = 'Copied!';
                    setTimeout(() => {
                        shareBtn.innerHTML = originalContent;
                    }, 2000);
                }
            }
            shareBtn.classList.remove('animated');
        };

        shareBtn.addEventListener('animationend', handler);
    });

    document.getElementById('copyLinkBtn').addEventListener('click', () => {
        const generatedLinkInput = document.getElementById('generatedLink');
        generatedLinkInput.select();
        navigator.clipboard.writeText(generatedLinkInput.value).then(() => {
            alert('Link copied to clipboard!');
        });
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

                const shortWalletAddress = `${walletAddress.slice(0, 5)}...${walletAddress.slice(-3)}`;
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
});

document.getElementById('linkForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const saveButton = document.getElementById('saveButton');
    saveButton.classList.add('loading');
    saveButton.disabled = true;

    const linkUrl = document.getElementById('linkUrl').value;

    fetch(`https://api.microlink.io?url=${linkUrl}`)
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'success') {
                alert('Invalid URL');
                return;
            }

            const { title, description, url, image } = data.data;
            const linkItem = createLinkItem(title, description, url, image.url);
            saveLink({ title, description, url, image: image.url });

            const linkList = document.getElementById('linkList');
            linkList.appendChild(linkItem);
            linkItem.scrollIntoView({ behavior: 'smooth', block: 'start' });

            document.getElementById('linkUrl').value = '';
            document.getElementById('titleInputContainer').classList.remove('hidden');
            checkLinkItems();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Could not fetch data');
        })
        .finally(() => {
            saveButton.classList.remove('loading');
            saveButton.disabled = false;
        });
});

function createLinkItem(title, description, url, imageUrl, isActive = false, comment = '', hasComment = false) {
    const linkItem = document.createElement('div');
    linkItem.className = 'linkItem';

    if (imageUrl) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'imgContainer';

        const img = document.createElement('img');
        img.src = imageUrl;
        imgContainer.appendChild(img);

        const pencilIcon = document.createElement('div');
        pencilIcon.className = 'pencilIcon';
        pencilIcon.innerHTML = '✎';
        pencilIcon.addEventListener('click', () => enableDrawing(imgContainer));

        const clearIcon = document.createElement('div');
        clearIcon.className = 'clearIcon hidden';
        clearIcon.innerHTML = '⦾';
        imgContainer.appendChild(pencilIcon);
        imgContainer.appendChild(clearIcon);

        linkItem.appendChild(imgContainer);
    }

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.textContent = title;
    linkItem.appendChild(link);

    if (description) {
        const desc = document.createElement('p');
        desc.textContent = description;
        linkItem.appendChild(desc);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'X';
    deleteBtn.addEventListener('click', () => {
        removeLink(url);
        linkItem.remove();
        checkLinkItems();
    });
    linkItem.appendChild(deleteBtn);

    const numberContainer = document.createElement('div');
    numberContainer.className = 'number-container';
    numberContainer.textContent = document.querySelectorAll('.linkItem').length + 1;
    if (isActive) {
        numberContainer.classList.add('active');
    }
    numberContainer.addEventListener('click', () => {
        numberContainer.classList.toggle('active');
        updateLinkActiveState(url, numberContainer.classList.contains('active'));
    });
    linkItem.appendChild(numberContainer);

    const commentBtn = document.createElement('div');
    commentBtn.className = 'comment-btn';
    commentBtn.textContent = '᳀';
    commentBtn.setAttribute('data-url', url);
    if (hasComment) {
        commentBtn.classList.add('has-comment');
    }
    linkItem.appendChild(commentBtn);

    return linkItem;
}

function updateLinkActiveState(url, isActive) {
    const links = JSON.parse(localStorage.getItem('links')) || [];
    links.forEach(link => {
        if (link.url === url) {
            link.isActive = isActive;
        }
    });
    localStorage.setItem('links', JSON.stringify(links));
}

function saveLink(link) {
    const links = JSON.parse(localStorage.getItem('links')) || [];
    const comment = localStorage.getItem(`comment-${link.url}`) || '';
    const hasComment = !!comment;
    links.push({ ...link, isActive: false, comment, hasComment });
    localStorage.setItem('links', JSON.stringify(links));
}

function loadLinks() {
    const links = JSON.parse(localStorage.getItem('links')) || [];
    const linkList = document.getElementById('linkList');
    linkList.innerHTML = '';
    links.forEach(link => {
        const linkItem = createLinkItem(link.title, link.description, link.url, link.image, link.isActive, link.comment, link.hasComment);
        linkList.appendChild(linkItem);
    });
    checkLinkItems();
    document.querySelectorAll('.imgContainer').forEach(container => {
        enableDrawing(container);
    });
}

function loadLinksFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const linksParam = urlParams.get('links');
    if (linksParam) {
        const links = JSON.parse(decodeURIComponent(linksParam));
        links.forEach(link => {
            if (link.comment) {
                localStorage.setItem(`comment-${link.url}`, link.comment);
            }
        });
        localStorage.setItem('links', JSON.stringify(links));
        loadLinks();
    }
}

function removeLink(url) {
    let links = JSON.parse(localStorage.getItem('links')) || [];
    links = links.filter(link => link.url !== url);
    localStorage.setItem('links', JSON.stringify(links));
    loadLinks();
    checkLinkItems();
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('comment-btn')) {
        const url = event.target.getAttribute('data-url');
        openCommentBox(url, event.target.parentElement);
    }
});

function openCommentBox(url, linkItem) {
    const existingCommentBox = linkItem.querySelector('.comment-box');
    if (existingCommentBox) {
        existingCommentBox.remove();
        return;
    }

    const commentBox = document.createElement('div');
    commentBox.className = 'comment-box';
    const textarea = document.createElement('textarea');
    textarea.className = 'comment-textarea';
    textarea.value = localStorage.getItem(`comment-${url}`) || '';
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Close';
    saveBtn.className = 'comment-save-btn';

    textarea.addEventListener('input', () => {
        if (textarea.value === localStorage.getItem(`comment-${url}`) || textarea.value === '') {
            saveBtn.textContent = 'Close';
        } else {
            saveBtn.textContent = 'Save';
        }
    });

    saveBtn.addEventListener('click', () => {
        if (saveBtn.textContent === 'Save') {
            localStorage.setItem(`comment-${url}`, textarea.value);
            linkItem.querySelector('.comment-btn').classList.add('has-comment');
            updateLinkCommentStatus(url, true, textarea.value);
        } else if (textarea.value === '') {
            localStorage.removeItem(`comment-${url}`);
            linkItem.querySelector('.comment-btn').classList.remove('has-comment');
            updateLinkCommentStatus(url, false, '');
        }
        commentBox.remove();
    });

    commentBox.appendChild(textarea);
    commentBox.appendChild(saveBtn);
    linkItem.appendChild(commentBox);
}

function updateLinkCommentStatus(url, hasComment, comment) {
    const links = JSON.parse(localStorage.getItem('links')) || [];
    links.forEach(link => {
        if (link.url === url) {
            link.hasComment = hasComment;
            link.comment = comment;
        }
    });
    localStorage.setItem('links', JSON.stringify(links));
}

function checkLinkItems() {
    const linkItems = document.querySelectorAll('.linkItem');
    const titleInputContainer = document.getElementById('titleInputContainer');
    titleInputContainer.classList.toggle('hidden', linkItems.length === 0);
    const titleContainer = document.getElementById('titleContainer');
    titleContainer.style.display = linkItems.length === 0 ? 'block' : 'none';
}

function typewriterEffect(element, text, interval = 100) {
    let index = 0;
    const type = () => {
        if (index < text.length) {
            element.placeholder += text.charAt(index);
            index++;
            setTimeout(type, interval);
        }
    };
    type();
}

function resetAnimation() {
    const placeholder = document.getElementById('linkUrl');
    placeholder.placeholder = '';
    typewriterEffect(placeholder, placeholder.getAttribute('data-text'));
}

window.onload = () => {
    resetAnimation();
    setInterval(resetAnimation, 18000);
};

async function saveStateOnline(walletAddress) {
    const pinataApiKey = '9b2c19fe686b4a404823';
    const pinataSecretApiKey = '8e44607ecd28a80789d38d79b99a8c4f6169b1d1d46a3dc2662dc3adfd982015';
    const currentState = {
        links: JSON.parse(localStorage.getItem('links')) || [],
        title: localStorage.getItem('currentTitle') || '',
        drawings: {},
        savedPages: JSON.parse(localStorage.getItem('savedPages')) || [],
        comments: {} // Store comments
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
    formData.append('file', new Blob([json], { type: 'application/json' }), `${walletAddress}.json`);

    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const headers = {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey
    };

    try {
        const saveButton = document.getElementById('saveOnlineBtn');
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        const data = await response.json();
        console.log('State saved to Pinata:', data);

        saveButton.textContent = 'Saved!';
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('Error saving state to Pinata:', error);
    }
}

async function loadStateOnline(walletAddress) {
    const pinataApiKey = '9b2c19fe686b4a404823';
    const pinataSecretApiKey = '8e44607ecd28a80789d38d79b99a8c4f6169b1d1d46a3dc2662dc3adfd982015';

    const url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[name]=${walletAddress}.json`;

    try {
        const loadButton = document.getElementById('loadOnlineBtn');
        const originalText = loadButton.textContent;
        loadButton.textContent = 'Loading...';
        loadButton.disabled = true;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        });
        const data = await response.json();

        if (data.rows.length > 0) {
            const hash = data.rows[0].ipfs_pin_hash;
            const contentUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
            const contentResponse = await fetch(contentUrl);
            const content = await contentResponse.json();

            localStorage.setItem('links', JSON.stringify(content.links));
            localStorage.setItem('currentTitle', content.title);
            localStorage.setItem('savedPages', JSON.stringify(content.savedPages));

            Object.keys(content.drawings).forEach(imgSrc => {
                localStorage.setItem(`drawing-data-${imgSrc}`, JSON.stringify(content.drawings[imgSrc]));
            });

            Object.keys(content.comments).forEach(url => {
                localStorage.setItem(`comment-${url}`, content.comments[url]);
            });

            loadLinks();
            document.getElementById('pageTitle').value = content.title;
            loadSavedPages();
            console.log('State loaded from Pinata:', content);

            loadButton.textContent = 'Loaded!';
            setTimeout(() => {
                loadButton.textContent = originalText;
                loadButton.disabled = false;
            }, 2000);
        } else {
            console.log('No state found for this wallet address.');
            loadButton.textContent = originalText;
            loadButton.disabled = false;
        }
    } catch (error) {
        console.error('Error loading state from Pinata:', error);
        loadButton.textContent = originalText;
        loadButton.disabled = false;
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
