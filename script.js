document.addEventListener('DOMContentLoaded', () => {
    loadLinksFromUrl();
    loadLinks();

    // Add event listeners for the info icon to show/hide the tooltip smoothly
    const infoIcon = document.querySelector('.infoInfo');
    const tooltip = infoIcon.querySelector('.tooltip');

    infoIcon.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10); // Small delay to ensure display is set before opacity
    });

    infoIcon.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 500); // Duration should match the CSS transition duration
    });
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

            // Прокрутка страницы к новому элементу с учетом отступа
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
    const longUrl = `${window.location.origin}${window.location.pathname}?links=${linksParam}`;

    // Use TinyURL API to shorten the URL
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
                alert('Shareable link copied to clipboard!');
            }).catch(err => {
                console.error('Error copying to clipboard: ', err);
                alert('Failed to copy link to clipboard');
            });
        } else {
            console.error('Error shortening URL: ', data);
            alert('Failed to shorten the URL');
        }
    })
    .catch(err => {
        console.error('Error shortening URL: ', err);
        alert('Failed to shorten the URL');
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
    linkList.innerHTML = ''; // Clear existing links
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
        loadLinks();
    }
}

function removeLink(url) {
    let links = JSON.parse(localStorage.getItem('links')) || [];
    links = links.filter(link => link.url !== url);
    localStorage.setItem('links', JSON.stringify(links));
    loadLinks();
}
