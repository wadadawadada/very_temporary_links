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
    commentBtn.textContent = '☰';
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

async function loadLinksFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const stateParam = urlParams.get('state');
    if (stateParam) {
        const pinataApiKey = '9b2c19fe686b4a404823';
        const pinataSecretApiKey = '8e44607ecd28a80789d38d79b99a8c4f6169b1d1d46a3dc2662dc3adfd982015';

        const contentUrl = `https://gateway.pinata.cloud/ipfs/${stateParam}`;
        try {
            const response = await fetch(contentUrl);
            const content = await response.json();

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
        } catch (error) {
            console.error('Error loading state from Pinata:', error);
        }
    } else {
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
}

function removeLink(url) {
    let links = JSON.parse(localStorage.getItem('links')) || [];
    links = links.filter(link => link.url !== url);
    localStorage.setItem('links', JSON.stringify(links));
    loadLinks();
    checkLinkItems();
}
