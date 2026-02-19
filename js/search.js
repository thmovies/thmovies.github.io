/* ============================================
   THMOVIES - Search & Typewriter Module
   ============================================ */

const Search = (() => {
    let debounceTimers = {};
    let typewriterInterval = null;
    let typewriterTimeout = null;
    let currentTypewriterInput = null;

    // Debounced search
    function setupSearch(inputEl, clearBtn, type, onResults) {
        inputEl.addEventListener('input', () => {
            const query = inputEl.value.trim();

            // Show/hide clear button
            if (clearBtn) {
                clearBtn.classList.toggle('visible', query.length > 0);
            }

            // Stop typewriter when user types
            if (query.length > 0 && currentTypewriterInput === inputEl) {
                stopTypewriter();
            }

            // Debounce
            clearTimeout(debounceTimers[type]);
            debounceTimers[type] = setTimeout(async () => {
                if (!query) {
                    onResults(null, type);
                    return;
                }
                const data = await API.search(type, query);
                onResults(data, type);
            }, CONFIG.DEBOUNCE_MS);
        });

        // Clear button handler
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                inputEl.value = '';
                clearBtn.classList.remove('visible');
                onResults(null, type);
                inputEl.focus();
                // Restart typewriter
                startTypewriter(inputEl);
            });
        }
    }

    // Typewriter effect for search placeholder
    function startTypewriter(inputEl) {
        stopTypewriter();
        currentTypewriterInput = inputEl;

        const words = CONFIG.TYPEWRITER_WORDS;
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let pauseDelay = 0;

        function tick() {
            // Don't animate if user has typed something
            if (inputEl.value.length > 0) {
                stopTypewriter();
                return;
            }

            const currentWord = words[wordIndex];

            if (!isDeleting) {
                // Typing
                charIndex++;
                inputEl.setAttribute('placeholder', currentWord.slice(0, charIndex));

                if (charIndex === currentWord.length) {
                    isDeleting = true;
                    pauseDelay = 2000; // Pause at full word
                }
            } else {
                // Deleting
                charIndex--;
                inputEl.setAttribute('placeholder', currentWord.slice(0, charIndex) || '\u200B');

                if (charIndex === 0) {
                    isDeleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                    pauseDelay = 300;
                }
            }

            const speed = isDeleting ? 40 : 80;
            typewriterTimeout = setTimeout(tick, speed + pauseDelay);
            pauseDelay = 0;
        }

        // Start with small delay
        typewriterTimeout = setTimeout(tick, 500);
    }

    function stopTypewriter() {
        clearTimeout(typewriterTimeout);
        clearInterval(typewriterInterval);
        typewriterTimeout = null;
        typewriterInterval = null;
        currentTypewriterInput = null;
    }

    return {
        setupSearch,
        startTypewriter,
        stopTypewriter
    };
})();
