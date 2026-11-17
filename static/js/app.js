/**
 * QuoteVerse - Vanilla JavaScript Client
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const featuredQuote = document.getElementById('featured-quote');
  const featuredAuthor = document.getElementById('featured-author');
  const featuredCategory = document.getElementById('featured-category');
  const featuredId = document.getElementById('featured-id');
  const newQuoteBtn = document.getElementById('new-quote-btn');
  const copyBtn = document.getElementById('copy-btn');
  const copyText = document.getElementById('copy-text');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const authorComboboxWrapper = document.getElementById('author-combobox-wrapper');
  const authorComboboxInput = document.getElementById('author-combobox-input');
  const authorDropdownList = document.getElementById('author-dropdown-list');
  const clearAuthorBtn = document.getElementById('clear-author-btn');
  const toggleAuthorDropdownBtn = document.getElementById('toggle-author-dropdown-btn');
  const categoryChips = document.getElementById('category-chips');
  const quotesGrid = document.getElementById('quotes-grid');
  const loadMoreContainer = document.getElementById('load-more-container');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const loadMoreCount = document.getElementById('load-more-count');
  const emptyState = document.getElementById('empty-state');
  const emptyResetBtn = document.getElementById('empty-reset-btn');
  const resultsCount = document.getElementById('results-count');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const statsBadge = document.getElementById('stats-badge');
  const themeToggle = document.getElementById('theme-toggle');
  const toast = document.getElementById('toast');
  const backToTopBtn = document.getElementById('back-to-top-btn');

  // --- State & Pagination ---
  const PAGE_SIZE = 12;
  let allAuthors = [];
  let highlightedAuthorIndex = -1;
  let isAuthorDropdownOpen = false;
  let activeCategory = '';
  let activeAuthor = '';
  let searchQuery = '';
  let currentQuote = null;
  let searchDebounceTimer = null;
  let currentQuotesList = [];
  let displayedCount = 0;

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem('quoteverse-theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function updateThemeIcon(theme) {
    const iconSpan = themeToggle.querySelector('.theme-icon');
    iconSpan.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('quoteverse-theme', newTheme);
    updateThemeIcon(newTheme);
  });

  // --- Toast Notification ---
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // --- Fetch Random Quote ---
  async function fetchRandomQuote() {
    try {
      featuredQuote.classList.add('fade-out');

      let url = '/api/quotes/random';
      const params = new URLSearchParams();
      if (activeCategory) params.append('category', activeCategory);
      if (activeAuthor) params.append('author', activeAuthor);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch quote');
      }
      const data = await res.json();
      currentQuote = data;

      setTimeout(() => {
        featuredQuote.textContent = data.quote;
        featuredAuthor.textContent = `— ${data.author}`;
        featuredCategory.textContent = data.category;
        featuredId.textContent = `#${data.id}`;
        featuredQuote.classList.remove('fade-out');
      }, 150);
    } catch (err) {
      console.error(err);
      featuredQuote.textContent = "Could not load quote. Try resetting filters.";
      featuredQuote.classList.remove('fade-out');
    }
  }

  // --- Copy Quote to Clipboard ---
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('Quote copied to clipboard! ✨');
      if (copyText) {
        copyText.textContent = 'Copied!';
        setTimeout(() => { copyText.textContent = 'Copy'; }, 1800);
      }
    } catch (err) {
      console.error('Copy failed: ', err);
      showToast('Could not copy to clipboard.');
    }
  }

  copyBtn.addEventListener('click', () => {
    if (!currentQuote) return;
    const text = `“${currentQuote.quote}”\n— ${currentQuote.author} (${currentQuote.category})`;
    copyToClipboard(text);
  });

  newQuoteBtn.addEventListener('click', fetchRandomQuote);

  // --- Fetch Metadata (Categories & Authors & Stats) ---
  async function loadMetadata() {
    try {
      // 1. Stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const stats = await statsRes.json();
        statsBadge.textContent = `${stats.total_quotes} Quotes`;
      }

      // 2. Categories
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const data = await catRes.json();
        data.categories.forEach(cat => {
          const chip = document.createElement('button');
          chip.className = 'chip';
          chip.textContent = cat;
          chip.dataset.category = cat;
          chip.addEventListener('click', () => onCategorySelect(cat, chip));
          categoryChips.appendChild(chip);
        });
      }

      // 3. Authors
      const authRes = await fetch('/api/authors');
      if (authRes.ok) {
        const data = await authRes.json();
        allAuthors = data.authors || [];
      }
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  }

  // --- Author Searchable Combobox ---
  function openAuthorDropdown() {
    isAuthorDropdownOpen = true;
    authorComboboxWrapper.classList.add('is-open');
    authorComboboxInput.setAttribute('aria-expanded', 'true');
    authorDropdownList.style.display = 'block';
    renderAuthorDropdown(authorComboboxInput.value.trim());
  }

  function closeAuthorDropdown() {
    isAuthorDropdownOpen = false;
    authorComboboxWrapper.classList.remove('is-open');
    authorComboboxInput.setAttribute('aria-expanded', 'false');
    authorDropdownList.style.display = 'none';
    highlightedAuthorIndex = -1;
  }

  function selectAuthor(author) {
    activeAuthor = author;
    authorComboboxInput.value = author;
    clearAuthorBtn.style.display = author ? 'block' : 'none';
    closeAuthorDropdown();
    applyFilters();
  }

  function renderAuthorDropdown(filterText = '') {
    authorDropdownList.innerHTML = '';
    highlightedAuthorIndex = -1;

    const lowerQuery = filterText.toLowerCase();
    const matching = lowerQuery
      ? allAuthors.filter(a => a.toLowerCase().includes(lowerQuery))
      : allAuthors;

    // "All Authors" option at top
    const allItem = document.createElement('li');
    allItem.className = 'combobox-item combobox-all-authors';
    allItem.setAttribute('role', 'option');
    allItem.innerHTML = `<span>✨ All Authors (Show All)</span>`;
    if (!activeAuthor) {
      allItem.classList.add('selected');
    }
    allItem.addEventListener('click', () => {
      selectAuthor('');
    });
    authorDropdownList.appendChild(allItem);

    if (matching.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'combobox-empty';
      emptyItem.textContent = `No authors matching "${filterText}"`;
      authorDropdownList.appendChild(emptyItem);
      return;
    }

    matching.forEach((author) => {
      const item = document.createElement('li');
      item.className = 'combobox-item';
      item.setAttribute('role', 'option');
      if (activeAuthor === author) {
        item.classList.add('selected');
      }

      if (lowerQuery) {
        const startIdx = author.toLowerCase().indexOf(lowerQuery);
        if (startIdx !== -1) {
          const endIdx = startIdx + lowerQuery.length;
          item.innerHTML = `
            <span>
              ${escapeHtml(author.slice(0, startIdx))}<span class="item-match">${escapeHtml(author.slice(startIdx, endIdx))}</span>${escapeHtml(author.slice(endIdx))}
            </span>
          `;
        } else {
          item.textContent = author;
        }
      } else {
        item.textContent = author;
      }

      item.addEventListener('click', () => {
        selectAuthor(author);
      });

      authorDropdownList.appendChild(item);
    });
  }

  function highlightItem(index) {
    const items = authorDropdownList.querySelectorAll('.combobox-item');
    if (!items.length) return;

    items.forEach(el => el.classList.remove('highlighted'));

    if (index >= 0 && index < items.length) {
      highlightedAuthorIndex = index;
      const target = items[index];
      target.classList.add('highlighted');
      target.scrollIntoView({ block: 'nearest' });
    }
  }

  // Combobox Listeners
  authorComboboxInput.addEventListener('focus', () => {
    openAuthorDropdown();
  });

  authorComboboxInput.addEventListener('click', () => {
    if (!isAuthorDropdownOpen) {
      openAuthorDropdown();
    }
  });

  authorComboboxInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    clearAuthorBtn.style.display = val ? 'block' : 'none';
    if (!isAuthorDropdownOpen) {
      openAuthorDropdown();
    } else {
      renderAuthorDropdown(val);
    }
  });

  authorComboboxInput.addEventListener('keydown', (e) => {
    const items = authorDropdownList.querySelectorAll('.combobox-item');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isAuthorDropdownOpen) {
        openAuthorDropdown();
      } else {
        const nextIdx = highlightedAuthorIndex < items.length - 1 ? highlightedAuthorIndex + 1 : 0;
        highlightItem(nextIdx);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isAuthorDropdownOpen) {
        const prevIdx = highlightedAuthorIndex > 0 ? highlightedAuthorIndex - 1 : items.length - 1;
        highlightItem(prevIdx);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isAuthorDropdownOpen) {
        if (highlightedAuthorIndex >= 0 && items[highlightedAuthorIndex]) {
          items[highlightedAuthorIndex].click();
        } else if (items.length > 0) {
          items[0].click();
        }
      } else {
        openAuthorDropdown();
      }
    } else if (e.key === 'Escape') {
      closeAuthorDropdown();
    }
  });

  toggleAuthorDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isAuthorDropdownOpen) {
      closeAuthorDropdown();
    } else {
      authorComboboxInput.focus();
      openAuthorDropdown();
    }
  });

  clearAuthorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectAuthor('');
    authorComboboxInput.focus();
    openAuthorDropdown();
  });

  document.addEventListener('click', (e) => {
    if (authorComboboxWrapper && !authorComboboxWrapper.contains(e.target)) {
      if (isAuthorDropdownOpen) {
        closeAuthorDropdown();
        authorComboboxInput.value = activeAuthor || '';
        clearAuthorBtn.style.display = activeAuthor ? 'block' : 'none';
      }
    }
  });

  // --- Category Selection ---
  function onCategorySelect(category, element) {
    const allChips = categoryChips.querySelectorAll('.chip');
    allChips.forEach(c => c.classList.remove('active'));

    if (activeCategory === category && category !== '') {
      // Unselect if clicking same category again
      activeCategory = '';
      categoryChips.querySelector('[data-category=""]').classList.add('active');
    } else {
      activeCategory = category;
      element.classList.add('active');
    }

    applyFilters();
  }

  // Attach listener to "All" chip
  categoryChips.querySelector('[data-category=""]').addEventListener('click', function() {
    onCategorySelect('', this);
  });

  // --- Search Input with Debounce ---
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      applyFilters();
    }, 200);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    applyFilters();
    searchInput.focus();
  });

  // --- Reset All Filters ---
  function resetAllFilters() {
    activeCategory = '';
    activeAuthor = '';
    searchQuery = '';
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    authorComboboxInput.value = '';
    clearAuthorBtn.style.display = 'none';
    closeAuthorDropdown();

    const allChips = categoryChips.querySelectorAll('.chip');
    allChips.forEach(c => c.classList.remove('active'));
    categoryChips.querySelector('[data-category=""]').classList.add('active');

    applyFilters();
  }

  resetFiltersBtn.addEventListener('click', resetAllFilters);
  emptyResetBtn.addEventListener('click', resetAllFilters);
  loadMoreBtn.addEventListener('click', renderNextBatch);

  // --- Apply Filters & Fetch Quotes ---
  async function applyFilters() {
    const hasFilter = activeCategory || activeAuthor || searchQuery;
    resetFiltersBtn.style.display = hasFilter ? 'inline-block' : 'none';

    const params = new URLSearchParams();
    if (activeCategory) params.append('category', activeCategory);
    if (activeAuthor) params.append('author', activeAuthor);
    if (searchQuery) params.append('q', searchQuery);

    const url = `/api/quotes?${params.toString()}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      currentQuotesList = data.quotes || [];
      displayedCount = 0;
      quotesGrid.innerHTML = '';

      if (currentQuotesList.length === 0) {
        emptyState.style.display = 'flex';
        quotesGrid.style.display = 'none';
        loadMoreContainer.style.display = 'none';
        resultsCount.textContent = 'No matching quotes found';
        return;
      }

      emptyState.style.display = 'none';
      quotesGrid.style.display = 'grid';

      renderNextBatch();
    } catch (err) {
      console.error('Filter query error:', err);
    }
  }

  // --- Render Next Batch (Pagination) ---
  function renderNextBatch() {
    const total = currentQuotesList.length;
    const nextLimit = Math.min(displayedCount + PAGE_SIZE, total);
    const batch = currentQuotesList.slice(displayedCount, nextLimit);

    batch.forEach(item => {
      const card = createQuoteCard(item);
      quotesGrid.appendChild(card);
    });

    displayedCount = nextLimit;
    updateResultsAndLoadMore();
  }

  // --- Update Results Count & Load More Button ---
  function updateResultsAndLoadMore() {
    const total = currentQuotesList.length;
    const remaining = total - displayedCount;
    const hasFilter = activeCategory || activeAuthor || searchQuery;

    if (displayedCount < total) {
      resultsCount.textContent = hasFilter
        ? `Showing ${displayedCount} of ${total} matching quotes`
        : `Showing ${displayedCount} of ${total} quotes`;
    } else {
      resultsCount.textContent = hasFilter
        ? `Showing all ${total} matching quote${total === 1 ? '' : 's'}`
        : `Showing all ${total} quotes`;
    }

    if (remaining > 0) {
      loadMoreContainer.style.display = 'flex';
      const nextBatchSize = Math.min(PAGE_SIZE, remaining);
      loadMoreCount.textContent = `${nextBatchSize} more`;
    } else {
      loadMoreContainer.style.display = 'none';
    }

    checkScrollBottom();
  }

  // --- Build Quote Card Element ---
  function createQuoteCard(item) {
    const card = document.createElement('article');
    card.className = 'quote-card grid-card';

    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `
      <span class="category-pill">${escapeHtml(item.category)}</span>
      <span class="quote-id">#${item.id}</span>
    `;

    const blockquote = document.createElement('blockquote');
    blockquote.textContent = `“${item.quote}”`;

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    
    const author = document.createElement('cite');
    author.className = 'author-name';
    author.textContent = `— ${item.author}`;

    const cardCopyBtn = document.createElement('button');
    cardCopyBtn.className = 'card-copy-btn';
    cardCopyBtn.title = 'Copy quote';
    cardCopyBtn.innerHTML = '📋';
    cardCopyBtn.addEventListener('click', () => {
      copyToClipboard(`“${item.quote}”\n— ${item.author}`);
    });

    footer.appendChild(author);
    footer.appendChild(cardCopyBtn);

    card.appendChild(header);
    card.appendChild(blockquote);
    card.appendChild(footer);

    return card;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Keyboard Shortcuts ---
  document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT');

    // Spacebar triggers New Quote (only when not typing in search box)
    if (e.code === 'Space' && !isInputActive) {
      e.preventDefault();
      fetchRandomQuote();
    }

    // Slash "/" focuses search input
    if (e.key === '/' && !isInputActive) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }

    // Escape clears search when focused
    if (e.key === 'Escape' && isInputActive) {
      searchInput.blur();
    }
  });

  // --- Scroll to Top FAB ---
  function checkScrollBottom() {
    if (!backToTopBtn) return;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // Show FAB when user has scrolled down to the very bottom of the page (within 80px buffer for sub-pixel / footer)
    const isScrollable = scrollHeight > clientHeight + 60;
    const isAtBottom = (scrollTop + clientHeight) >= (scrollHeight - 80);

    if (isScrollable && isAtBottom) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  }

  window.addEventListener('scroll', checkScrollBottom, { passive: true });
  window.addEventListener('resize', checkScrollBottom);

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // --- Initialization ---
  initTheme();
  loadMetadata();
  fetchRandomQuote();
  applyFilters();
});
