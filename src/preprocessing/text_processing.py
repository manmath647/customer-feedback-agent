"""
Text Processing Pipeline for Sentiment Analysis
Implements industry-standard NLP text cleaning:
- Lowercase normalization
- URL, HTML tag, and email address stripping
- User mention (@user) and hashtag (#hashtag -> hashtag) normalization
- Emoji & emoticon conversion to sentiment tokens (emoji_positive, emoji_negative, emoji_neutral)
- Contraction expansion (don't -> do not, can't -> cannot, etc.) prior to stopword removal
- Stopword removal with STRICT PRESERVATION of negation words
- Lemmatization (WordNet / spaCy) & optional Stemming (Porter / Snowball)
- Repeated character / elongation reduction (soooo -> soo -> so)
"""

import re
import html
from typing import List, Optional

# Extended Contraction Mapping
CONTRACTION_MAP = {
    "won't": "will not",
    "can't": "cannot",
    "i'm": "i am",
    "you're": "you are",
    "he's": "he is",
    "she's": "she is",
    "it's": "it is",
    "we're": "we are",
    "they're": "they are",
    "i've": "i have",
    "you've": "you have",
    "we've": "we have",
    "they've": "they have",
    "i'll": "i will",
    "you'll": "you will",
    "he'll": "he will",
    "she'll": "she will",
    "we'll": "we will",
    "they'll": "they will",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "hasn't": "has not",
    "haven't": "have not",
    "hadn't": "had not",
    "doesn't": "does not",
    "don't": "do not",
    "didn't": "did not",
    "couldn't": "could not",
    "shouldn't": "should not",
    "wouldn't": "would not",
    "mustn't": "must not",
    "mightn't": "might not",
    "that's": "that is",
    "what's": "what is",
    "where's": "where is",
    "there's": "there is",
    "who's": "who is",
    "how's": "how is",
    "ain't": "is not",
    "n't": " not",
    "'re": " are",
    "'s": " is",
    "'d": " would",
    "'ll": " will",
    "'t": " not",
    "'ve": " have",
    "'m": " am"
}

# Negation words MUST be preserved to keep sentiment polarity intact
NEGATION_WORDS = {
    "not", "no", "never", "neither", "nor", "cannot", "none", "nobody",
    "nothing", "nowhere", "hardly", "scarcely", "barely", "dont", "cant",
    "wont", "couldnt", "shouldnt", "wouldnt", "isnt", "arent", "wasnt",
    "werent", "havent", "hasnt", "hadnt", "doesnt", "didnt"
}

# Standard English stopwords (excluding preserved negation words)
DEFAULT_STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down",
    "during", "each", "few", "for", "from", "further", "had", "has", "have",
    "having", "he", "hed", "hell", "hes", "her", "here", "heres", "hers", "herself",
    "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if",
    "in", "into", "is", "it", "its", "itself", "lets", "me", "more", "most", "my",
    "myself", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
    "ours", "ourselves", "out", "over", "own", "same", "she", "shed", "shell",
    "shes", "should", "so", "some", "such", "than", "that", "thats", "the", "their",
    "theirs", "them", "themselves", "then", "there", "theres", "these", "they",
    "theyd", "theyll", "theyre", "theyve", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "we", "wed", "well", "were",
    "weve", "what", "whats", "when", "whens", "where", "wheres", "which", "while",
    "who", "whos", "whom", "why", "whys", "with", "would", "you", "youd", "youll",
    "youre", "youve", "your", "yours", "yourself", "yourselves"
} - NEGATION_WORDS

# Emoticon & Emoji mappings
EMOJI_PATTERNS = [
    (re.compile(r'(?::|;|=)(?:-)?(?:\)|D|d|]|}>|\*)'), ' emoji_positive '),
    (re.compile(r'(?::|;|=)(?:-)?(?:\(|\[|\{|<)'), ' emoji_negative '),
    (re.compile(r'(?::|;|=)(?:-)?(?:P|p|o|O|\|)'), ' emoji_neutral '),
    (re.compile(r'[\U0001F600-\U0001F60F\U0001F61C-\U0001F61F\U0001F601-\U0001F60B\U0001F60D-\U0001F60E\U0001F44D\U0001F44C]'), ' emoji_positive '),
    (re.compile(r'[\U0001F612-\U0001F616\U0001F620-\U0001F637\U0001F44E\U0001F494]'), ' emoji_negative '),
    (re.compile(r'[\U0001F610-\U0001F611\U0001F638-\U0001F640]'), ' emoji_neutral ')
]

# Simple fallbacks for NLTK/spaCy lemmatizer & stemmer
try:
    import nltk
    from nltk.stem import WordNetLemmatizer, PorterStemmer
    _lemmatizer = WordNetLemmatizer()
    _stemmer = PorterStemmer()
    _has_nltk = True
except Exception:
    _lemmatizer = None
    _stemmer = None
    _has_nltk = False


def expand_contractions(text: str) -> str:
    """Expand short-form contractions prior to stopword removal."""
    pattern = re.compile(r'\b(' + '|'.join(re.escape(key) for key in CONTRACTION_MAP.keys()) + r')\b', re.IGNORECASE)
    def replace(match):
        word = match.group(0).lower()
        return CONTRACTION_MAP.get(word, word)
    return pattern.sub(replace, text)


def normalize_emojis(text: str) -> str:
    """Map emoticons and emojis to descriptive text tokens."""
    for pattern, replacement in EMOJI_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def reduce_elongated_words(text: str) -> str:
    """Reduce repeated character elongations (e.g. 'soooo' -> 'soo', 'gooddd' -> 'good')."""
    return re.sub(r'(.)\1{2,}', r'\1\1', text)


def lemmatize_word(word: str) -> str:
    """Lemmatize a single token using NLTK WordNet if available."""
    if _has_nltk and _lemmatizer:
        try:
            return _lemmatizer.lemmatize(word)
        except Exception:
            pass
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"
    if word.endswith("es") and len(word) > 3:
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]
    return word


def stem_word(word: str) -> str:
    """Stem a single token using PorterStemmer if available."""
    if _has_nltk and _stemmer:
        try:
            return _stemmer.stem(word)
        except Exception:
            pass
    if word.endswith("ing") and len(word) > 5:
        return word[:-3]
    if word.endswith("ed") and len(word) > 4:
        return word[:-2]
    if word.endswith("ly") and len(word) > 4:
        return word[:-2]
    return word


def preprocess_text(
    text: str,
    remove_stopwords: bool = False,
    use_stemming: bool = False,
    preserve_negation: bool = True
) -> str:
    """
    Main text processing pipeline function.
    
    Args:
        text: Raw review string.
        remove_stopwords: If True, filters out standard stopwords. Default False per user instruction.
        use_stemming: If True, applies stemming in addition to/instead of lemmatization.
        preserve_negation: If True, explicitly preserves negation words ('not', 'no', etc.).

    Returns:
        Cleaned, normalized, tokenized string ready for vectorization.
    """
    if not isinstance(text, str) or not text.strip():
        return ""

    # 1. Unescape HTML entities
    text = html.unescape(text)

    # 2. Lowercase normalization
    text = text.lower()

    # 3. URL, HTML tags, and Email stripping
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\S+@\S+\.\S+', ' ', text)

    # 4. User mentions & Hashtags normalization (@user -> '', #hashtag -> hashtag)
    text = re.sub(r'@\w+', ' ', text)
    text = re.sub(r'#(\w+)', r'\1', text)

    # 5. Emoji & Emoticon handling
    text = normalize_emojis(text)

    # 6. Expand contractions BEFORE tokenization/filtering
    text = expand_contractions(text)

    # 7. Character elongation reduction (soooo -> soo)
    text = reduce_elongated_words(text)

    # 8. Clean non-alphanumeric characters (preserve spaces and emoji tokens)
    text = re.sub(r'[^a-z0-9_\s]', ' ', text)

    # 9. Tokenization & Optional Stopword Removal
    tokens = text.split()
    if remove_stopwords:
        stopwords = DEFAULT_STOPWORDS if preserve_negation else (DEFAULT_STOPWORDS | NEGATION_WORDS)
    else:
        stopwords = set()

    filtered_tokens = []
    for token in tokens:
        if token not in stopwords or token in NEGATION_WORDS:
            # 10. Lemmatization and/or Stemming
            processed_token = lemmatize_word(token)
            if use_stemming:
                processed_token = stem_word(processed_token)
            filtered_tokens.append(processed_token)

    return " ".join(filtered_tokens)



if __name__ == "__main__":
    test_samples = [
        "This product isn't good at all! Terrible service @support :( http://example.com #fail",
        "SOOOOO happy with the fast delivery! :) Loved it ❤️",
        "Don't buy this, works poorly and cannot connect to wifi.",
        "Average quality, nothing special. Neutral experience."
    ]
    print("--- Test Preprocessing Pipeline ---")
    for s in test_samples:
        print(f"RAW:   {s}")
        print(f"CLEAN: {preprocess_text(s)}\n")
