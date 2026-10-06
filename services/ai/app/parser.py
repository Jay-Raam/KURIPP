import re
import csv
import io
from typing import List, Dict, Any, Optional

class ParsedPage:
    def __init__(self, page_number: int, text: str, headings: List[str]):
        self.page_number = page_number
        self.text = text
        self.headings = headings

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_number": self.page_number,
            "text": self.text,
            "headings": self.headings,
        }

class DocumentParser:
    """
    Intelligent layout and content parser extracting structural text,
    markdown tables, and section headings across formats.
    """

    @staticmethod
    def parse_text_or_markdown(content: str) -> List[ParsedPage]:
        """
        Parses Markdown or plain text into logical pages and headings.
        """
        lines = content.splitlines()
        headings = []
        current_page_text = []
        pages: List[ParsedPage] = []
        current_page_num = 1
        line_count = 0

        for line in lines:
            # Detect Markdown headings
            heading_match = re.match(r"^(#{1,6})\s+(.*)$", line.strip())
            if heading_match:
                headings.append(heading_match.group(2).strip())

            current_page_text.append(line)
            line_count += 1

            # Page break heuristic: ~60 lines per logical page or form feed
            if "\x0c" in line or line_count >= 60:
                pages.append(
                    ParsedPage(
                        page_number=current_page_num,
                        text="\n".join(current_page_text).strip(),
                        headings=list(headings),
                    )
                )
                current_page_num += 1
                current_page_text = []
                line_count = 0

        if current_page_text or not pages:
            pages.append(
                ParsedPage(
                    page_number=current_page_num,
                    text="\n".join(current_page_text).strip(),
                    headings=list(headings),
                )
            )

        return pages

    @staticmethod
    def parse_csv_or_tabular(content: str) -> List[ParsedPage]:
        """
        Parses CSV or tabular data into formatted Markdown tables
        to preserve columnar relationship for LLM chunking.
        """
        reader = csv.reader(io.StringIO(content))
        rows = list(reader)

        if not rows:
            return [ParsedPage(page_number=1, text="", headings=["Empty Spreadsheet"])]

        header = rows[0]
        data_rows = rows[1:]

        # Format as clean Markdown table
        header_line = "| " + " | ".join(header) + " |"
        sep_line = "| " + " | ".join(["---"] * len(header)) + " |"

        markdown_rows = [header_line, sep_line]
        for row in data_rows:
            # Pad row if columns are missing
            padded_row = row + [""] * (len(header) - len(row))
            markdown_rows.append("| " + " | ".join(padded_row[:len(header)]) + " |")

        full_table_text = "\n".join(markdown_rows)

        return [
            ParsedPage(
                page_number=1,
                text=full_table_text,
                headings=[f"Spreadsheet Table ({len(data_rows)} rows)"],
            )
        ]

    @staticmethod
    def parse_html(content: str) -> List[ParsedPage]:
        """
        Strips scripts, styles, and tags while preserving paragraphs and headings.
        """
        # Remove scripts and style blocks
        clean = re.sub(r"<script[^>]*>[\s\S]*?</script>", "", content, flags=re.IGNORECASE)
        clean = re.sub(r"<style[^>]*>[\s\S]*?</style>", "", clean, flags=re.IGNORECASE)

        # Convert HTML headings to Markdown headings
        for level in range(1, 7):
            prefix = "#" * level
            clean = re.sub(
                rf"<h{level}[^>]*>([\s\S]*?)</h{level}>",
                rf"\n\n{prefix} \1\n\n",
                clean,
                flags=re.IGNORECASE,
            )

        # Convert block tags to line breaks
        clean = re.sub(r"<(?:p|div|li|tr)[^>]*>", "\n", clean, flags=re.IGNORECASE)
        clean = re.sub(r"<br\s*/?>", "\n", clean, flags=re.IGNORECASE)

        # Remove remaining tags
        clean = re.sub(r"<[^>]+>", "", clean)

        # Normalize whitespace
        lines = [line.strip() for line in clean.splitlines() if line.strip()]
        text = "\n\n".join(lines)

        return DocumentParser.parse_text_or_markdown(text)

    @classmethod
    def parse(cls, content: str, mime_type: str) -> List[ParsedPage]:
        """
        Main parser router inspecting MIME type.
        """
        mime = mime_type.lower()
        if "csv" in mime or "spreadsheet" in mime or "excel" in mime:
            return cls.parse_csv_or_tabular(content)
        elif "html" in mime:
            return cls.parse_html(content)
        else:
            return cls.parse_text_or_markdown(content)
