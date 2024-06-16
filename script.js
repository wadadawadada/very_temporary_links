document.addEventListener('DOMContentLoaded', () => {
    loadLinksFromUrl();
    loadLinks();

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

    const provider = new WalletConnectProvider.default({
        infuraId: "YOUR_INFURA_PROJECT_ID",
    });

    document.getElementById('connectWalletBtn').addEventListener('click', async () => {
        try {
            await provider.enable();
            const web3 = new Web3(provider);

            const accounts = await web3.eth.getAccounts();
            console.log('Connected accounts:', accounts);
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    });

    document.getElementById('myLinksBtn').addEventListener('click', () => {
        console.log('myLinksBtn clicked');
        const currentLinks = JSON.parse(localStorage.getItem('links')) || [];
        if (currentLinks.length === 0) {
            alert('No links to save.');
            return;
        }

        const pageCount = savedPages.length + 1;

        const savedPage = {
            id: pageCount,
            links: currentLinks
        };

        console.log('Saving page:', savedPage);

        savedPages.push(savedPage);
        localStorage.setItem('savedPages', JSON.stringify(savedPages));

        createSavedPageElement(savedPage.id);

        localStorage.removeItem('links');
        loadLinks();
    });

    document.getElementById('shareBtn').addEventListener('click', function() {
        const shareBtn = this;
        const originalContent = shareBtn.innerHTML; // Store the original content of the button

        shareBtn.classList.add('animated');

        shareBtn.addEventListener('animationend', function handler() {
            shareBtn.removeEventListener('animationend', handler);
            const currentLinks = JSON.parse(localStorage.getItem('links')) || [];
            const linksParam = encodeURIComponent(JSON.stringify(currentLinks));
            const longUrl = `${window.location.origin}${window.location.pathname}?links=${linksParam}`;

            fetch(`https://api.tinyurl.com/create?api_token=9XhspWrHEHf7ieo1IlDpHEnjOAieV09pD5icaG6WWxuaolrsEEywKab0qL0n`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: longUrl,
                    domain: "tinyurl.com"
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.data) {
                    const shortUrl = data.data.tiny_url;
                    navigator.clipboard.writeText(shortUrl).then(() => {
                        shareBtn.classList.remove('animated');
                        shareBtn.classList.add('copied');
                        shareBtn.innerHTML = 'Copied!';

                        setTimeout(() => {
                            shareBtn.classList.remove('copied');
                            shareBtn.innerHTML = originalContent;
                            shareBtn.style.backgroundColor = ''; // Reset background color
                        }, 1000); // Reset after 3 seconds
                    }).catch(err => {
                        console.error('Error copying to clipboard: ', err);
                        shareBtn.classList.remove('animated');
                    });
                } else {
                    console.error('Error shortening URL: ', data);
                    shareBtn.classList.remove('animated');
                }
            })
            .catch(err => {
                console.error('Error shortening URL: ', err);
                shareBtn.classList.remove('animated');
            });
        });
    });

    function createSavedPageElement(id) {
        const savedPageElement = document.createElement('div');
        savedPageElement.className = 'savedPage';
        savedPageElement.setAttribute('data-id', id);
        savedPageElement.textContent = id;

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
                loadLinks();
            }
        });
        document.getElementById('savedPagesContainer').appendChild(savedPageElement);
    }

    function deleteSavedPage(id) {
        let savedPages = JSON.parse(localStorage.getItem('savedPages')) || [];
        savedPages = savedPages.filter(page => page.id !== id);
        savedPages.forEach((page, index) => {
            page.id = index + 1; // Renumber after deletion
        });
        localStorage.setItem('savedPages', JSON.stringify(savedPages));
        loadSavedPages();
    }

    function loadSavedPages() {
        const savedPages = JSON.parse(localStorage.getItem('savedPages')) || [];
        document.getElementById('savedPagesContainer').innerHTML = '';
        savedPages.forEach(page => createSavedPageElement(page.id));
    }

    loadSavedPages();
});

document.getElementById('linkForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const linkUrl = document.getElementById('linkUrl').value;

    fetch(`https://api.microlink.io?url=${linkUrl}`)
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'success') {
                alert('Invalid URL');
                return;
            }

            const { title, description, url, image } = data.data;

            let linkItem = createLinkItem(title, description, url, image.url);
            saveLink({ title, description, url, image: image.url });

            const linkList = document.getElementById('linkList');
            linkList.appendChild(linkItem);

            linkItem.scrollIntoView({ behavior: 'smooth', block: 'start' });

            document.getElementById('linkUrl').value = '';
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Could not fetch data');
        });
});

document.getElementById('shareBtn').addEventListener('click', function() {
    const shareBtn = this;
    const originalContent = shareBtn.innerHTML; // Store the original content of the button

    shareBtn.classList.add('animated');

    shareBtn.addEventListener('animationend', function handler() {
        shareBtn.removeEventListener('animationend', handler);
        const links = JSON.parse(localStorage.getItem('links')) || [];
        const linksParam = encodeURIComponent(JSON.stringify(links));
        const longUrl = `${window.location.origin}${window.location.pathname}?links=${linksParam}`;

        fetch(`https://api.tinyurl.com/create?api_token=9XhspWrHEHf7ieo1IlDpHEnjOAieV09pD5icaG6WWxuaolrsEEywKab0qL0n`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: longUrl,
                domain: "tinyurl.com"
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.data) {
                const shortUrl = data.data.tiny_url;
                navigator.clipboard.writeText(shortUrl).then(() => {
                    shareBtn.classList.remove('animated');
                    shareBtn.classList.add('copied');
                    shareBtn.innerHTML = 'Copied!';
                    
                    setTimeout(() => {
                        shareBtn.classList.remove('copied');
                        shareBtn.innerHTML = originalContent;
                        shareBtn.style.backgroundColor = ''; // Reset background color
                    }, 1000); // Reset after 3 seconds
                }).catch(err => {
                    console.error('Error copying to clipboard: ', err);
                    shareBtn.classList.remove('animated');
                });
            } else {
                console.error('Error shortening URL: ', data);
                shareBtn.classList.remove('animated');
            }
        })
        .catch(err => {
            console.error('Error shortening URL: ', err);
            shareBtn.classList.remove('animated');
        });
    });
});

document.getElementById('toggleDirectionBtn').addEventListener('click', function() {
    const linkList = document.getElementById('linkList');
    if (linkList.style.flexDirection === 'row') {
        linkList.style.flexDirection = 'column';
    } else {
        linkList.style.flexDirection = 'row';
    }
});

function createLinkItem(title, description, url, imageUrl, isActive = false, comment = '', hasComment = false) {
    let linkItem = document.createElement('div');
    linkItem.className = 'linkItem';

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        linkItem.appendChild(img);
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
    deleteBtn.addEventListener('click', function() {
        removeLink(url);
        linkItem.remove();
    });
    linkItem.appendChild(deleteBtn);

    const numberContainer = document.createElement('div');
    numberContainer.className = 'number-container';
    numberContainer.textContent = document.querySelectorAll('.linkItem').length + 1;
    if (isActive) {
        numberContainer.classList.add('active');
    }
    numberContainer.addEventListener('click', function() {
        numberContainer.classList.toggle('active');
        updateLinkActiveState(url, numberContainer.classList.contains('active'));
    });
    linkItem.appendChild(numberContainer);

    // Добавление кнопки комментариев
    const commentBtn = document.createElement('div');
    commentBtn.className = 'comment-btn';
    commentBtn.textContent = '✉';
    commentBtn.setAttribute('data-url', url);
    if (hasComment) {
        commentBtn.classList.add('has-comment');
    }
    linkItem.appendChild(commentBtn);

    return linkItem;
}

function updateLinkActiveState(url, isActive) {
    let links = JSON.parse(localStorage.getItem('links')) || [];
    links = links.map(link => {
        if (link.url === url) {
            return { ...link, isActive };
        }
        return link;
    });
    localStorage.setItem('links', JSON.stringify(links));
}

function saveLink(link) {
    let links = JSON.parse(localStorage.getItem('links')) || [];
    const comment = localStorage.getItem(`comment-${link.url}`) || '';
    const hasComment = !!comment;
    links.push({ ...link, isActive: false, comment, hasComment });
    localStorage.setItem('links', JSON.stringify(links));
}

function loadLinks() {
    let links = JSON.parse(localStorage.getItem('links')) || [];
    const linkList = document.getElementById('linkList');
    linkList.innerHTML = '';
    links.forEach(link => {
        let linkItem = createLinkItem(link.title, link.description, link.url, link.image, link.isActive, link.comment, link.hasComment);
        linkList.appendChild(linkItem);
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
}

// Обработчик для кнопки комментариев
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('comment-btn')) {
        const url = event.target.getAttribute('data-url');
        openCommentBox(url, event.target.parentElement);
    }
});

function openCommentBox(url, linkItem) {
    // Удаляем существующее окно комментариев, если оно есть
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
    let links = JSON.parse(localStorage.getItem('links')) || [];
    links = links.map(link => {
        if (link.url === url) {
            return { ...link, hasComment, comment };
        }
        return link;
    });
    localStorage.setItem('links', JSON.stringify(links));
}
