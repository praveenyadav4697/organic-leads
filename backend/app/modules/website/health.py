from typing import Dict, Any


class HealthCalculator:
    def calculate(self, scan_results: Dict[str, Any]) -> Dict[str, Any]:
        scores = {
            "performance": self._score_performance(scan_results),
            "security": self._score_security(scan_results),
            "seo": self._score_seo(scan_results),
            "accessibility": self._score_accessibility(scan_results),
            "best_practices": self._score_best_practices(scan_results),
        }

        overall = sum(scores.values()) / len(scores)

        grade = "critical"
        if overall >= 90:
            grade = "excellent"
        elif overall >= 80:
            grade = "good"
        elif overall >= 70:
            grade = "fair"
        elif overall >= 60:
            grade = "poor"

        return {
            "overall_score": overall,
            "performance_score": scores["performance"],
            "accessibility_score": scores["accessibility"],
            "seo_score": scores["seo"],
            "security_score": scores["security"],
            "best_practices_score": scores["best_practices"],
            "grade": grade,
            "details": {
                "ssl": scan_results.get("ssl", {}).get("security_rating"),
                "hosting": scan_results.get("hosting", {}).get("server_health"),
                "plugin_count": len(scan_results.get("plugins", [])),
                "theme_count": len(scan_results.get("themes", [])),
            },
        }

    def _score_performance(self, results: Dict[str, Any]) -> float:
        hosting = results.get("hosting", {})
        score = 50.0
        if hosting.get("server_software") != "unknown":
            score += 10
        if hosting.get("memory_limit"):
            score += 10
        return min(score, 100.0)

    def _score_security(self, results: Dict[str, Any]) -> float:
        ssl = results.get("ssl", {})
        security = results.get("security", {})

        score = 0.0
        if ssl.get("https_enabled"):
            score += 40
        if ssl.get("hsts_enabled"):
            score += 10
        if security.get("xss_protection"):
            score += 10
        if security.get("x_frame_options"):
            score += 10
        if security.get("content_security_policy"):
            score += 10
        if security.get("vulnerability_count", 0) == 0:
            score += 20
        return min(score, 100.0)

    def _score_seo(self, results: Dict[str, Any]) -> float:
        score = 50.0
        if results.get("cms") == "wordpress":
            score += 20
        if results.get("dns", {}).get("propagation_status") == "resolved":
            score += 15
        return min(score, 100.0)

    def _score_accessibility(self, results: Dict[str, Any]) -> float:
        return 60.0

    def _score_best_practices(self, results: Dict[str, Any]) -> float:
        score = 50.0
        if results.get("ssl", {}).get("https_enabled"):
            score += 20
        hosting = results.get("hosting", {})
        if hosting.get("server_software") != "unknown":
            score += 15
        return min(score, 100.0)
