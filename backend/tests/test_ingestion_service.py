import json
from app.services.ingestion_service import (
    slugify,
    _truncate,
    _extract_json_from_response,
    _parse_topic_list,
)


class TestSlugify:
    def test_basic(self):
        assert slugify("Constitutional Law") == "constitutional-law"

    def test_special_chars(self):
        assert slugify("Right to Privacy (2017)") == "right-to-privacy-2017"

    def test_strips_leading_trailing(self):
        assert slugify("--hello world--") == "hello-world"

    def test_multiple_spaces(self):
        assert slugify("a   b   c") == "a-b-c"


class TestTruncate:
    def test_short_text(self):
        assert _truncate("hello", 100) == "hello"

    def test_exact_length(self):
        assert _truncate("abcde", 5) == "abcde"

    def test_long_text(self):
        result = _truncate("abcdefghij", 5)
        assert result == "abcde..."
        assert len(result) == 8

    def test_empty_string(self):
        assert _truncate("") == ""

    def test_none_like_empty(self):
        assert _truncate("") == ""


class TestExtractJsonFromResponse:
    def test_clean_json(self):
        raw = '{"facts": "some facts", "judgment": "upheld"}'
        result = _extract_json_from_response(raw)
        assert result["facts"] == "some facts"

    def test_json_with_surrounding_text(self):
        raw = 'Here is the JSON:\n{"key": "value"}\nDone.'
        result = _extract_json_from_response(raw)
        assert result["key"] == "value"

    def test_no_json(self):
        result = _extract_json_from_response("no json here")
        assert result == {}

    def test_invalid_json(self):
        result = _extract_json_from_response("{invalid json}")
        assert result == {}


class TestParseTopicList:
    def test_clean_array(self):
        raw = '["Constitutional Law", "Privacy"]'
        assert _parse_topic_list(raw) == ["Constitutional Law", "Privacy"]

    def test_dict_with_topics_key(self):
        raw = json.dumps({"topics": ["A", "B"]})
        assert _parse_topic_list(raw) == ["A", "B"]

    def test_array_with_surrounding_text(self):
        raw = 'Topics:\n["A", "B", "C"]\nEnd'
        assert _parse_topic_list(raw) == ["A", "B", "C"]

    def test_garbage(self):
        assert _parse_topic_list("not json at all") == []
