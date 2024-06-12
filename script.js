document.addEventListener('DOMContentLoaded', () => {
    loadLinksFromUrl();
    loadLinks();
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

            // Прокрутка страницы к новому элементу
            linkItem.scrollIntoView({ behavior: 'smooth', block: 'start' });

            document.getElementById('linkUrl').value = '';
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Could not fetch data');
        });
});

document.getElementById('shareBtn').addEventListener('click', function() {
    const links = JSON.parse(localStorage.getItem('links')) || [];
    const linksParam = encodeURIComponent(JSON.stringify(links));
    const uniquePath = generateUniquePath();
    const shareUrl = `https://verytemporary.netlify.app/${uniquePath}?links=${linksParam}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Shareable link copied to clipboard!');
    }).catch(err => {
        console.error('Error copying to clipboard: ', err);
        alert('Failed to copy link to clipboard');
    });
});

function generateUniquePath() {
    return 'generatedlink/' + Math.random().toString(36).substr(2, 9);
}

function createLinkItem(title, description, url, imageUrl) {
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

    return linkItem;
}

function saveLink(link) {
    let links = JSON.parse(localStorage.getItem('links')) || [];
    links.push(link);
    localStorage.setItem('links', JSON.stringify(links));
}

function loadLinks() {
    let links = JSON.parse(localStorage.getItem('links')) || [];
    const linkList = document.getElementById('linkList');
    links.forEach(link => {
        let linkItem = createLinkItem(link.title, link.description, link.url, link.image);
        linkList.appendChild(linkItem);
    });
}

function loadLinksFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const linksParam = urlParams.get('links');
    if (linksParam) {
        const links = JSON.parse(decodeURIComponent(linksParam));
        localStorage.setItem('links', JSON.stringify(links));
    }
}

function removeLink(url) {
    let links = JSON.parse(localStorage.getItem('links')) || [];
    links = links.filter(link => link.url !== url);
    localStorage.setItem('links', JSON.stringify(links));
}
