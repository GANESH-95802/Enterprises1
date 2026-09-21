/**
 * TextChunker
 * Splits large document text into semantically meaningful chunks for embedding.
 * Follows SOLID principles — this module is solely responsible for chunking.
 */
class TextChunker {
  constructor() {
    this.defaultChunkSize = parseInt(process.env.KNOWLEDGE_CHUNK_SIZE || '1000', 10);
    this.defaultOverlap = parseInt(process.env.KNOWLEDGE_CHUNK_OVERLAP || '150', 10);
    this.minChunkSize = 200;
  }

  /**
   * Split text into chunks based on chunk size and overlap
   * @param {string} text - Full document text
   * @param {Object} options - { chunkSize, overlap }
   * @returns {Array<Object>} - Array of { content, index, startOffset, endOffset }
   */
  chunk(text, options = {}) {
    try {
      if (!text || typeof text !== 'string') return [];

      const chunkSize = options.chunkSize || this.defaultChunkSize;
      const overlap = options.overlap !== undefined ? options.overlap : this.defaultOverlap;
      const cleaned = this.cleanText(text);

      if (cleaned.length <= chunkSize) {
        return [{
          content: cleaned,
          index: 0,
          startOffset: 0,
          endOffset: cleaned.length,
        }];
      }

      const chunks = [];
      const sentences = this.splitIntoSentences(cleaned);
      let currentChunk = '';
      let startOffset = 0;

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];

        // If a single sentence exceeds the chunk size, hard-split it
        if (sentence.length > chunkSize) {
          if (currentChunk.trim()) {
            chunks.push({
              content: currentChunk.trim(),
              index: chunks.length,
              startOffset,
              endOffset: startOffset + currentChunk.trim().length,
            });
            startOffset += currentChunk.trim().length - Math.min(overlap, currentChunk.trim().length);
            currentChunk = '';
          }
          // Split the long sentence into pieces
          const pieces = this.hardSplit(sentence, chunkSize, overlap);
          for (const piece of pieces) {
            chunks.push({
              content: piece.trim(),
              index: chunks.length,
              startOffset,
              endOffset: startOffset + piece.trim().length,
            });
            startOffset += piece.trim().length - Math.min(overlap, piece.trim().length);
          }
          continue;
        }

        if ((currentChunk + ' ' + sentence).trim().length <= chunkSize) {
          currentChunk = (currentChunk + ' ' + sentence).trim();
        } else {
          if (currentChunk.trim()) {
            chunks.push({
              content: currentChunk.trim(),
              index: chunks.length,
              startOffset,
              endOffset: startOffset + currentChunk.trim().length,
            });
            // Overlap: keep the tail of the previous chunk
            const overlapText = this.getOverlapText(currentChunk, overlap);
            startOffset += currentChunk.length - overlapText.length;
            currentChunk = overlapText;
          }
          currentChunk = (currentChunk + ' ' + sentence).trim();
        }
      }

      // Push the final chunk
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunks.length,
          startOffset,
          endOffset: startOffset + currentChunk.trim().length,
        });
      }

      // Filter out chunks that are too small (unless there's only one)
      const filtered = chunks.filter((c, i) => {
        if (chunks.length === 1) return true;
        return c.content.length >= this.minChunkSize || i === chunks.length - 1;
      });

      return filtered;
    } catch (error) {
      console.error('Text chunker error:', error.message);
      return [];
    }
  }

  /**
   * Clean text by normalizing whitespace while preserving paragraphs
   * @param {string} text - Raw text
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .trim();
  }

  /**
   * Split text into sentences using punctuation boundaries
   * @param {string} text - Cleaned text
   * @returns {Array<string>} - Array of sentences
   */
  splitIntoSentences(text) {
    const sentenceEndings = /(?<=[.!?])\s+(?=[A-Z0-9"'])|(?<=\n)\s*(?=\S)/g;
    const parts = text.split(sentenceEndings);
    return parts.map((p) => p.trim()).filter(Boolean);
  }

  /**
   * Hard split a long segment into fixed-size pieces with overlap
   * @param {string} text - Long text segment
   * @param {number} chunkSize - Maximum chunk size
   * @param {number} overlap - Overlap between pieces
   * @returns {Array<string>} - Array of pieces
   */
  hardSplit(text, chunkSize, overlap) {
    const pieces = [];
    let remaining = text;

    while (remaining.length > chunkSize) {
      // Try to break at a space near the chunk size boundary
      let breakIndex = chunkSize;
      const spaceIndex = remaining.lastIndexOf(' ', chunkSize);
      if (spaceIndex > chunkSize * 0.7) {
        breakIndex = spaceIndex;
      }

      const piece = remaining.substring(0, breakIndex);
      pieces.push(piece.trim());

      remaining = remaining.substring(breakIndex - Math.min(overlap, breakIndex));
    }

    if (remaining.trim()) {
      pieces.push(remaining.trim());
    }

    return pieces;
  }

  /**
   * Extract overlap text from the tail of a chunk
   * @param {string} chunk - Chunk content
   * @param {number} overlap - Desired overlap characters
   * @returns {string} - Overlapping tail text
   */
  getOverlapText(chunk, overlap) {
    if (chunk.length <= overlap) return chunk;
    // Try to find a sentence boundary near the overlap point
    const tail = chunk.substring(chunk.length - overlap);
    const spaceIndex = tail.indexOf(' ');
    return spaceIndex > 0 && spaceIndex < overlap * 0.5 ? tail.substring(spaceIndex + 1) : tail;
  }
}

// Export singleton
const textChunker = new TextChunker();

module.exports = textChunker;
module.exports.TextChunker = TextChunker;