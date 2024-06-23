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
            loadSavedPages(true); // Pass true to activate the first saved page
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
