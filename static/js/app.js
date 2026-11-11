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
  const authorSelect = document.getElementById('author-select');
  const categoryChips = document.getElementById('category-chips');
  const quotesGrid = document.getElementById('quotes-grid');
  const emptyState = document.getElementById('empty-state');
  const emptyResetBtn = document.getElementById('empty-reset-btn');
  const resultsCount = document.getElementById('results-count');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const statsBadge = document.getElementById('stats-badge');
  const themeToggle = document.getElementById('theme-toggle');
  const toast = document.getElementById('toast');

  // --- State ---
  let activeCategory = '';
  let activeAuthor = '';
  let searchQuery = '';
  let currentQuote = null;
  let searchDebounceTimer = null;
  let allQuotesCache = [];

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
        data.authors.forEach(author => {
          const option = document.createElement('option');
          option.value = author;
          option.textContent = author;
          authorSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  }

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

  // --- Author Selection ---
  authorSelect.addEventListener('change', (e) => {
    activeAuthor = e.target.value;
    applyFilters();
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
    authorSelect.value = '';

    const allChips = categoryChips.querySelectorAll('.chip');
    allChips.forEach(c => c.classList.remove('active'));
    categoryChips.querySelector('[data-category=""]').classList.add('active');

    applyFilters();
  }

  resetFiltersBtn.addEventListener('click', resetAllFilters);
  emptyResetBtn.addEventListener('click', resetAllFilters);

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
      renderQuotesGrid(data.quotes);
      
      const count = data.total;
      resultsCount.textContent = hasFilter
        ? `Found ${count} matching quote${count === 1 ? '' : 's'}`
        : `Showing all ${count} quotes`;
    } catch (err) {
      console.error('Filter query error:', err);
    }
  }

  // --- Render Quotes Grid ---
  function renderQuotesGrid(quotes) {
    quotesGrid.innerHTML = '';

    if (!quotes || quotes.length === 0) {
      emptyState.style.display = 'flex';
      quotesGrid.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    quotesGrid.style.display = 'grid';

    quotes.forEach(item => {
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

      quotesGrid.appendChild(card);
    });
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

  // --- Initialization ---
  initTheme();
  loadMetadata();
  fetchRandomQuote();
  applyFilters();
});
