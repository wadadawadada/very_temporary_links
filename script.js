document.addEventListener('DOMContentLoaded', () => {
    loadLinksFromUrl();
    loadLinks();
    checkLinkItems(); // Initial check on load

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

                    if (isMobile) {
                        const generatedLinkContainer = document.getElementById('generatedLinkContainer');
                        const generatedLinkInput = document.getElementById('generatedLink');
                        generatedLinkInput.value = shortUrl;
                        generatedLinkContainer.classList.remove('hidden');
                    } else {
                        navigator.clipboard.writeText(shortUrl).then(() => {
                            shareBtn.innerHTML = 'Copied!';
                            setTimeout(() => {
                                shareBtn.innerHTML = originalContent;
                            }, 2000); // Show "Copied!" for 2 seconds
                        }).catch(err => {
                            console.error('Error copying to clipboard: ', err);
                        });
                    }

                    shareBtn.classList.remove('animated');
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

    document.getElementById('copyLinkBtn').addEventListener('click', function() {
        const generatedLinkInput = document.getElementById('generatedLink');
        generatedLinkInput.select();
        generatedLinkInput.setSelectionRange(0, 99999); // For mobile devices

        navigator.clipboard.writeText(generatedLinkInput.value).then(() => {
            alert('Link copied to clipboard!');
        }).catch(err => {
            console.error('Error copying to clipboard: ', err);
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
        const currentLinks = JSON.parse(localStorage.getItem('links')) || [];
        if (currentLinks.length === 0) {
            alert('No links to save.');
            return;
        }

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
        document.getElementById('savedPagesContainer').innerHTML = '';
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
            page.id = index + 1; // Renumber after deletion
        });
        localStorage.setItem('savedPages', JSON.stringify(savedPages));
        loadSavedPages();
        checkLinkItems(); // Check after deleting a saved page
    }

    loadSavedPages();

    document.querySelectorAll('.imgContainer').forEach(container => {
        enableDrawing(container);
    });

    const toggleDirectionBtn = document.getElementById('toggleDirectionBtn');
    const linkList = document.getElementById('linkList');
    let isGrid = true; // Initial layout is grid

    toggleDirectionBtn.addEventListener('click', () => {
        if (isGrid) {
            linkList.classList.remove('grid-layout');
            linkList.classList.add('column-layout');
        } else {
            linkList.classList.remove('column-layout');
            linkList.classList.add('grid-layout');
        }
        isGrid = !isGrid;
    });
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

            let linkItem = createLinkItem(title, description, url, image.url);
            saveLink({ title, description, url, image: image.url });

            const linkList = document.getElementById('linkList');
            linkList.appendChild(linkItem);

            linkItem.scrollIntoView({ behavior: 'smooth', block: 'start' });

            document.getElementById('linkUrl').value = '';
            document.getElementById('titleInputContainer').classList.remove('hidden');
            checkLinkItems(); // Check after adding a new link
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
    let linkItem = document.createElement('div');
    linkItem.className = 'linkItem';

    if (imageUrl) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'imgContainer';

        const img = document.createElement('img');
        img.src = imageUrl;
        imgContainer.appendChild(img);

        const pencilIcon = document.createElement('div');
        pencilIcon.className = 'pencilIcon';
        pencilIcon.innerHTML = '✏️';
        pencilIcon.addEventListener('click', function() {
            enableDrawing(imgContainer);
        });

        imgContainer.appendChild(pencilIcon);
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
    deleteBtn.addEventListener('click', function() {
        removeLink(url);
        linkItem.remove();
        checkLinkItems(); // Check after removing a link
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
    checkLinkItems(); // Check after loading links
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
    checkLinkItems(); // Check after removing a link
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

function checkLinkItems() {
    const linkItems = document.querySelectorAll('.linkItem');
    const titleInputContainer = document.getElementById('titleInputContainer');
    if (linkItems.length === 0) {
        titleInputContainer.classList.add('hidden');
    } else {
        titleInputContainer.classList.remove('hidden');
    }
}

// Function to animate the placeholder text
function typewriterEffect(element, text, interval = 100) {
    let index = 0;
    function type() {
        if (index < text.length) {
            element.placeholder += text.charAt(index);
            index++;
            setTimeout(type, interval);
        }
    }
    type();
}

function resetAnimation() {
    const placeholder = document.getElementById('linkUrl');
    placeholder.placeholder = ""; // Clear the placeholder
    typewriterEffect(placeholder, placeholder.getAttribute('data-text')); // Restart the typing effect
}

window.onload = () => {
    resetAnimation();
    setInterval(resetAnimation, 18000);
};

// Drawing functionality
function enableDrawing(container) {
    let canvas = container.querySelector('canvas');
    const img = container.querySelector('img');

    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = img.offsetTop + 'px';
        canvas.style.left = img.offsetLeft + 'px';
        container.appendChild(canvas);
        resizeCanvas(canvas, img);
    }

    const ctx = canvas.getContext('2d');
    const savedPaths = JSON.parse(localStorage.getItem(`drawing-paths-${img.src}`)) || [];
    if (savedPaths.length > 0) {
        paths[img.src] = savedPaths;
        redrawPaths(ctx, savedPaths, canvas, img);
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        [x, y] = [e.offsetX, e.offsetY];
        currentPath = [{ x, y }];
    });

    canvas.addEventListener('mousemove', (e) => draw(e, ctx, canvas, img));
    canvas.addEventListener('mouseup', () => {
        if (isDrawing) {
            isDrawing = false;
            paths[img.src] = paths[img.src] || [];
            paths[img.src].push(currentPath);
            savePaths(img.src, paths[img.src]);
        }
    });
    canvas.addEventListener('mouseout', () => isDrawing = false);

    window.addEventListener('resize', () => resizeCanvas(canvas, img));
}

function draw(e, ctx, canvas, img) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    [x, y] = [e.offsetX, e.offsetY];
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 5;
    ctx.stroke();
    currentPath.push({ x, y });
}

function savePaths(imgSrc, paths) {
    localStorage.setItem(`drawing-paths-${imgSrc}`, JSON.stringify(paths));
}

function redrawPaths(ctx, paths, canvas, img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before redrawing
    paths.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 5;
        ctx.stroke();
    });
}

function resizeCanvas(canvas, img) {
    const ctx = canvas.getContext('2d');
    const savedPaths = JSON.parse(localStorage.getItem(`drawing-paths-${img.src}`)) || [];

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (savedPaths.length > 0) {
        redrawPaths(ctx, savedPaths, canvas, img);
    }
}
