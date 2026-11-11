"""
Automated Test Suite for QuoteVerse Flask Application
"""
import json
import os
import pytest
from app import app, DATA_FILE


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestDataIntegrity:
    """Verify integrity of the 1000 quotes JSON dataset."""

    def test_quotes_file_exists(self):
        assert os.path.exists(DATA_FILE), f"Quotes file not found at {DATA_FILE}"

    def test_exact_1000_quotes(self):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            quotes = json.load(f)
        assert len(quotes) == 1000, f"Expected 1000 quotes, found {len(quotes)}"

    def test_quote_fields_valid(self):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            quotes = json.load(f)

        ids = set()
        for idx, item in enumerate(quotes):
            assert "id" in item, f"Quote at index {idx} is missing 'id'"
            assert "quote" in item and len(item["quote"].strip()) > 0, f"Quote at index {idx} has invalid 'quote'"
            assert "author" in item and len(item["author"].strip()) > 0, f"Quote at index {idx} has invalid 'author'"
            assert "category" in item and len(item["category"].strip()) > 0, f"Quote at index {idx} has invalid 'category'"
            
            # Check unique IDs
            assert item["id"] not in ids, f"Duplicate quote id {item['id']}"
            ids.add(item["id"])

        assert len(ids) == 1000


class TestAPIEndpoints:
    """Verify all Flask HTTP REST endpoints."""

    def test_index_page(self, client):
        res = client.get("/")
        assert res.status_code == 200
        assert b"QuoteVerse" in res.data
        assert b"1000 Timeless" in res.data

    def test_random_quote_unfiltered(self, client):
        res = client.get("/api/quotes/random")
        assert res.status_code == 200
        data = res.get_json()
        assert "id" in data
        assert "quote" in data
        assert "author" in data
        assert "category" in data

    def test_random_quote_with_category(self, client):
        res = client.get("/api/quotes/random?category=Philosophy")
        assert res.status_code == 200
        data = res.get_json()
        assert data["category"] == "Philosophy"

    def test_random_quote_not_found(self, client):
        res = client.get("/api/quotes/random?category=NonExistentCategory999")
        assert res.status_code == 404
        data = res.get_json()
        assert "error" in data

    def test_all_quotes_endpoint(self, client):
        res = client.get("/api/quotes")
        assert res.status_code == 200
        data = res.get_json()
        assert data["total"] == 1000
        assert len(data["quotes"]) == 1000

    def test_quotes_filter_by_author(self, client):
        res = client.get("/api/quotes?author=Turing")
        assert res.status_code == 200
        data = res.get_json()
        assert data["total"] >= 1
        for q in data["quotes"]:
            assert "turing" in q["author"].lower()

    def test_quotes_filter_by_category(self, client):
        res = client.get("/api/quotes?category=Artificial Intelligence")
        assert res.status_code == 200
        data = res.get_json()
        assert data["total"] >= 1
        for q in data["quotes"]:
            assert q["category"] == "Artificial Intelligence"

    def test_quotes_search_query(self, client):
        res = client.get("/api/quotes?q=electricity")
        assert res.status_code == 200
        data = res.get_json()
        assert data["total"] >= 1
        assert any("electricity" in q["quote"].lower() for q in data["quotes"])

    def test_categories_endpoint(self, client):
        res = client.get("/api/categories")
        assert res.status_code == 200
        data = res.get_json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        assert "Philosophy" in data["categories"]
        assert "Artificial Intelligence" in data["categories"]

    def test_authors_endpoint(self, client):
        res = client.get("/api/authors")
        assert res.status_code == 200
        data = res.get_json()
        assert "authors" in data
        assert "Alan Turing" in data["authors"]
        assert "Albert Einstein" in data["authors"]

    def test_stats_endpoint(self, client):
        res = client.get("/api/stats")
        assert res.status_code == 200
        data = res.get_json()
        assert data["total_quotes"] == 1000
        assert data["total_categories"] > 0
        assert data["total_authors"] > 0
