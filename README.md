# QuoteVerse — 1000 Well-Known Quotes Web App

An interactive full-stack web application built with **Python Flask**, **Vanilla JavaScript**, **HTML5**, and modern **CSS3**. It displays 1000 curated quotes from historical figures, philosophers, scientists, and leaders, with support for random quote generation, author search, and category filtering.

---

## Features

- **1000 Curated Quotes**: Sourced across Philosophy, Science & Technology, Leadership, Inspiration, Wisdom, and Artificial Intelligence.
- **Random Quote Generator**: Smooth transition hero card with one-click random generation (or press <kbd>Spacebar</kbd>).
- **Previous Quote History**: Step backward through recently viewed quotes (or press <kbd>P</kbd> / <kbd>←</kbd>) so skipped quotes are never lost.
- **Search & Filter with Highlighting**: Real-time debounced search across quote text and author names with dynamic `<mark>` keyword highlighting (press <kbd>/</kbd> to quickly search).
- **Searchable Author Combobox**: Fast autocomplete input with keyboard navigation (<kbd>↑</kbd>/<kbd>↓</kbd>/<kbd>Enter</kbd>) across 120+ authors.
- **Category Chips**: Fast filtering by category (All, Philosophy, Science, AI, etc.).
- **Favorites & Bookmarks**: Save favorite quotes locally (`localStorage`) with one click (🤍/❤️) and view them via a dedicated "Favorites" chip filter.
- **Pagination & "Load More"**: Batch loading (12 cards at a time) for optimal DOM performance and smooth browsing.
- **Back to Top FAB**: Floating action button that appears when scrolled to the bottom for instant return to top.
- **Keyboard Shortcuts Modal**: Built-in cheat sheet accessible via the `?` header button or pressing <kbd>?</kbd>.
- **Clipboard Copy**: One-click formatted quote copying to clipboard.
- **Social Media & Native Sharing**: Share quotes directly to 𝕏 (Twitter), ✈️ Telegram, 💬 WhatsApp, and 💼 LinkedIn, plus Web Share API support on mobile.
- **Light & Dark Mode**: Persistent theme toggle matching modern design aesthetics.
- **REST API**: Clean endpoints for integration or programmatic access.

---

## Quick Start

### 1. Activate the Virtual Environment
```powershell
.\.venv\Scripts\Activate.ps1
```

### 2. Run the Application
```powershell
python app.py
```
Or with the virtual environment Python directly:
```powershell
.\.venv\Scripts\python.exe app.py
```

Open your browser at **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.

---

## Running the Automated Tests

Run the test suite with `pytest`:
```powershell
.\.venv\Scripts\python.exe -m pytest tests/ -v
```

All 14 tests verify:
- Exact 1000 quotes and schema data integrity
- Random quote endpoint with optional filters
- Text search across quote contents and author names
- Category and author metadata endpoints
- HTTP response status codes and edge-case handling

---

## API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Single-page HTML application |
| `/api/quotes/random` | `GET` | Returns a random quote. Supports `?category=` and `?author=` |
| `/api/quotes` | `GET` | Returns list of quotes. Supports `?q=`, `?author=`, `?category=` |
| `/api/categories` | `GET` | Returns all unique categories |
| `/api/authors` | `GET` | Returns all unique authors |
| `/api/stats` | `GET` | Returns total quotes, categories, and authors count |

---

## Keyboard Shortcuts
- <kbd>Space</kbd>: Fetch a new random quote
- <kbd>P</kbd> or <kbd>←</kbd>: Go back to previous quote in history
- <kbd>/</kbd>: Focus search bar
- <kbd>Esc</kbd>: Unfocus search bar / exit modals
- <kbd>T</kbd>: Toggle light / dark theme
- <kbd>?</kbd>: Open / close keyboard shortcuts cheat sheet
- <kbd>↑</kbd> / <kbd>↓</kbd> / <kbd>Enter</kbd>: Navigate and select in author combobox
