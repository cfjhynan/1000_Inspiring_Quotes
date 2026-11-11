# QuoteVerse — 1000 Well-Known Quotes Web App

An interactive full-stack web application built with **Python Flask**, **Vanilla JavaScript**, **HTML5**, and modern **CSS3**. It displays 1000 curated quotes from historical figures, philosophers, scientists, and leaders, with support for random quote generation, author search, and category filtering.

---

## Features

- **1000 Curated Quotes**: Sourced across Philosophy, Science & Technology, Leadership, Inspiration, Wisdom, and Artificial Intelligence.
- **Random Quote Generator**: Smooth transition hero card with one-click random generation (or press <kbd>Spacebar</kbd>).
- **Search & Filter**: Real-time debounced search by quote text or author name (press <kbd>/</kbd> to quickly search).
- **Category Chips**: Fast filtering by category (All, Philosophy, Science, AI, etc.).
- **Author Dropdown**: Filter quotes by specific author.
- **Clipboard Copy**: One-click formatted quote copying to clipboard.
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
- <kbd>/</kbd>: Focus search bar
- <kbd>Esc</kbd>: Unfocus search bar
