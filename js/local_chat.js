document.addEventListener('DOMContentLoaded', () => {
    const copyLinkButton = document.getElementById('copyLinkButton');
    const chatLinkContainer = document.getElementById('chatLink');

    copyLinkButton.addEventListener('click', async () => {
        const link = chatLinkContainer.textContent;
        try {
            await navigator.clipboard.writeText(link);
            alert('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy link using clipboard API:', err);

            // Fallback method
            const textArea = document.createElement("textarea");
            textArea.value = link;
            textArea.style.position = "fixed";  // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    alert('Link copied to clipboard!');
                } else {
                    throw new Error('Fallback: Oops, unable to copy');
                }
            } catch (err) {
                console.error('Fallback method failed:', err);
                alert('Failed to copy the link. Please try again.');
            }
            document.body.removeChild(textArea);
        }
    });
});
