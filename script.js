document.addEventListener('DOMContentLoaded', () => {
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

function removeLink(url) {
    let links = JSON.parse(localStorage.getItem('links')) || [];
    links = links.filter(link => link.url !== url);
    localStorage.setItem('links', JSON.stringify(links));
}
