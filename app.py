"""
Flask Web Application for Random & Searchable Quotes
"""
import json
import os
import random
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Base path for data file
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "quotes.json")


def load_quotes():
    """Load quotes from the JSON data file."""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route("/")
def index():
    """Serve the main HTML page."""
    return render_template("index.html")


@app.route("/api/quotes/random", methods=["GET"])
def get_random_quote():
    """
    Get a single random quote.
    Supports optional query filters:
      - category: filter by category name (case-insensitive)
      - author: filter by author name substring (case-insensitive)
    """
    quotes = load_quotes()
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    filtered = quotes
    if category:
        filtered = [q for q in filtered if q.get("category", "").strip().lower() == category]
    if author:
        filtered = [q for q in filtered if author in q.get("author", "").strip().lower()]

    if not filtered:
        return jsonify({"error": "No quotes match the specified criteria"}), 404

    return jsonify(random.choice(filtered))


@app.route("/api/quotes", methods=["GET"])
def get_quotes():
    """
    Search and filter quotes.
    Query parameters:
      - q: search query matching quote text or author
      - author: filter by author (case-insensitive substring)
      - category: filter by category (case-insensitive exact)
    """
    quotes = load_quotes()
    q = request.args.get("q", "").strip().lower()
    author = request.args.get("author", "").strip().lower()
    category = request.args.get("category", "").strip().lower()

    filtered = quotes

    if category:
        filtered = [item for item in filtered if item.get("category", "").strip().lower() == category]

    if author:
        filtered = [item for item in filtered if author in item.get("author", "").strip().lower()]

    if q:
        filtered = [
            item for item in filtered
            if q in item.get("quote", "").lower() or q in item.get("author", "").lower()
        ]

    return jsonify({
        "total": len(filtered),
        "quotes": filtered
    })


@app.route("/api/categories", methods=["GET"])
def get_categories():
    """Return all unique categories sorted alphabetically."""
    quotes = load_quotes()
    categories = sorted(list({q.get("category", "") for q in quotes if q.get("category")}))
    return jsonify({"categories": categories})


@app.route("/api/authors", methods=["GET"])
def get_authors():
    """Return all unique authors sorted alphabetically."""
    quotes = load_quotes()
    authors = sorted(list({q.get("author", "") for q in quotes if q.get("author")}))
    return jsonify({"authors": authors})


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Return collection summary statistics."""
    quotes = load_quotes()
    categories = {q.get("category", "") for q in quotes if q.get("category")}
    authors = {q.get("author", "") for q in quotes if q.get("author")}
    return jsonify({
        "total_quotes": len(quotes),
        "total_categories": len(categories),
        "total_authors": len(authors)
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
