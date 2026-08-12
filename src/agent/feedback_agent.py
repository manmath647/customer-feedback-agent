"""
Feedback Agent Module
Provides analytical aggregation and decision logic for customer feedback review batches.
"""

from typing import List, Dict, Any

class FeedbackAgent:
    """Agent orchestrator for feedback dataset insight extraction."""
    
    def __init__(self):
        pass

    def summarize_batch(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        total = len(results)
        if total == 0:
            return {"total": 0, "sentiment_distribution": {}, "net_sentiment_score": 0.0}

        counts = {"positive": 0, "neutral": 0, "negative": 0, "insufficient_text": 0}
        for r in results:
            s = r.get("predicted_sentiment", "neutral")
            counts[s] = counts.get(s, 0) + 1

        # Net Sentiment Score: (Positive - Negative) / Total * 100
        pos = counts["positive"]
        neg = counts["negative"]
        net_score = round(((pos - neg) / total) * 100, 2)

        return {
            "total_analyzed": total,
            "counts": counts,
            "net_sentiment_score": net_score,
            "positive_ratio": round((pos / total) * 100, 1),
            "negative_ratio": round((neg / total) * 100, 1),
            "neutral_ratio": round((counts["neutral"] / total) * 100, 1)
        }
