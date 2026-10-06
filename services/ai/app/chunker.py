import re
from typing import List, Dict, Any, Optional
from .parser import ParsedPage

class Chunk:
    def __init__(
        self,
        chunk_index: int,
        content: str,
        token_count: int,
        page_number: Optional[int] = None,
        section_heading: Optional[str] = None,
    ):
        self.chunk_index = chunk_index
        self.content = content
        self.token_count = token_count
        self.page_number = page_number
        self.section_heading = section_heading

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_index": self.chunk_index,
            "content": self.content,
            "token_count": self.token_count,
            "page_number": self.page_number,
            "section_heading": self.section_heading,
        }

class SemanticChunker:
    """
    Semantic Boundary Chunker preserving section headings, paragraphs,
    and markdown table structures with controlled token overlaps.
    """

    def __init__(
        self,
        target_tokens: int = 500,
        min_tokens: int = 50,
        overlap_tokens: int = 50,
    ):
        self.target_tokens = target_tokens
        self.min_tokens = min_tokens
        self.overlap_tokens = overlap_tokens

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """
        Estimates token count (~4 characters per token).
        """
        if not text:
            return 0
        return max(1, len(text.strip()) // 4)

    def chunk_pages(self, pages: List[ParsedPage]) -> List[Chunk]:
        """
        Chunks a list of parsed pages into cohesive semantic units.
        """
        all_chunks: List[Chunk] = []
        global_index = 0
        current_heading = "Introduction"

        for page in pages:
            if page.headings:
                current_heading = page.headings[0]

            page_text = page.text.strip()
            if not page_text:
                continue

            # Split text by structural sections (headings or double linebreaks)
            paragraphs = self._split_paragraphs_and_sections(page_text)

            current_chunk_text = ""
            current_tokens = 0

            for para in paragraphs:
                # Update current heading if paragraph is a heading
                heading_match = re.match(r"^(#{1,6})\s+(.*)$", para.strip())
                if heading_match:
                    current_heading = heading_match.group(2).strip()

                para_tokens = self.estimate_tokens(para)

                # If single paragraph exceeds target tokens, split by sentences
                if para_tokens > self.target_tokens:
                    # Flush existing buffer first
                    if current_chunk_text.strip():
                        all_chunks.append(
                            Chunk(
                                chunk_index=global_index,
                                content=current_chunk_text.strip(),
                                token_count=self.estimate_tokens(current_chunk_text),
                                page_number=page.page_number,
                                section_heading=current_heading,
                            )
                        )
                        global_index += 1
                        current_chunk_text = ""
                        current_tokens = 0

                    sentence_chunks = self._chunk_long_paragraph(
                        para, page.page_number, current_heading, global_index
                    )
                    all_chunks.extend(sentence_chunks)
                    global_index += len(sentence_chunks)
                    continue

                if current_tokens + para_tokens > self.target_tokens:
                    # Current buffer is full, emit chunk
                    if current_chunk_text.strip():
                        all_chunks.append(
                            Chunk(
                                chunk_index=global_index,
                                content=current_chunk_text.strip(),
                                token_count=self.estimate_tokens(current_chunk_text),
                                page_number=page.page_number,
                                section_heading=current_heading,
                            )
                        )
                        global_index += 1

                    # Compute overlap from previous text
                    overlap_text = self._extract_overlap(current_chunk_text)
                    current_chunk_text = (overlap_text + "\n\n" + para).strip() if overlap_text else para
                    current_tokens = self.estimate_tokens(current_chunk_text)
                else:
                    if current_chunk_text:
                        current_chunk_text += "\n\n" + para
                    else:
                        current_chunk_text = para
                    current_tokens += para_tokens

            # Flush remaining buffer for this page
            if current_chunk_text.strip() and self.estimate_tokens(current_chunk_text) >= self.min_tokens:
                all_chunks.append(
                    Chunk(
                        chunk_index=global_index,
                        content=current_chunk_text.strip(),
                        token_count=self.estimate_tokens(current_chunk_text),
                        page_number=page.page_number,
                        section_heading=current_heading,
                    )
                )
                global_index += 1

        return all_chunks

    def _split_paragraphs_and_sections(self, text: str) -> List[str]:
        # Split on double newlines while keeping table blocks intact
        blocks = re.split(r"\n\s*\n", text)
        return [b.strip() for b in blocks if b.strip()]

    def _extract_overlap(self, text: str) -> str:
        """
        Takes approximately overlap_tokens worth of text from the end of the chunk.
        """
        target_chars = self.overlap_tokens * 4
        if len(text) <= target_chars:
            return ""
        overlap = text[-target_chars:]
        # Find first sentence break or whitespace
        space_idx = overlap.find(" ")
        if space_idx != -1:
            overlap = overlap[space_idx + 1 :]
        return overlap.strip()

    def _chunk_long_paragraph(
        self,
        paragraph: str,
        page_number: int,
        heading: str,
        start_index: int,
    ) -> List[Chunk]:
        """
        Splits a single long paragraph along sentence boundaries.
        """
        sentences = re.split(r"(?<=[.!?])\s+", paragraph)
        chunks: List[Chunk] = []
        buf = ""
        current_idx = start_index

        for s in sentences:
            if not s.strip():
                continue
            s_tokens = self.estimate_tokens(s)
            buf_tokens = self.estimate_tokens(buf)

            if buf_tokens + s_tokens > self.target_tokens and buf.strip():
                chunks.append(
                    Chunk(
                        chunk_index=current_idx,
                        content=buf.strip(),
                        token_count=buf_tokens,
                        page_number=page_number,
                        section_heading=heading,
                    )
                )
                current_idx += 1
                buf = s
            else:
                buf = (buf + " " + s).strip() if buf else s

        if buf.strip():
            chunks.append(
                Chunk(
                    chunk_index=current_idx,
                    content=buf.strip(),
                    token_count=self.estimate_tokens(buf),
                    page_number=page_number,
                    section_heading=heading,
                )
            )

        return chunks
