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
