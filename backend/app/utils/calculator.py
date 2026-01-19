"""Requirement analysis calculator utility."""
from typing import Dict, Any, List, Optional
from datetime import datetime


class RequirementCalculator:
    """Calculator for requirement analysis scores and metrics."""

    # MoSCoW priority scores
    MOSCOW_SCORES = {
        "must_have": 100,
        "should_have": 75,
        "could_have": 50,
        "wont_have": 25,
    }

    # Kano category scores
    KANO_SCORES = {
        "excitement": 100,
        "performance": 75,
        "basic": 50,
        "indifferent": 25,
        "reverse": 0,
    }

    # Weights for overall score calculation
    OVERALL_WEIGHTS = {
        "invest": 0.30,
        "moscow": 0.20,
        "kano": 0.20,
        "rice": 0.30,
    }

    @staticmethod
    def calculate_invest_score(invest_analysis: Dict[str, bool]) -> float:
        """
        Calculate INVEST analysis score.

        INVEST: Independent, Negotiable, Valuable, Estimable, Small, Testable

        Args:
            invest_analysis: Dictionary with INVEST criteria as boolean values

        Returns:
            Score from 0 to 100
        """
        criteria = [
            "independent",
            "negotiable",
            "valuable",
            "estimable",
            "small",
            "testable",
        ]

        passed = sum(1 for criterion in criteria if invest_analysis.get(criterion, False))
        score = (passed / len(criteria)) * 100

        return round(score, 2)

    @staticmethod
    def get_moscow_score(priority: str) -> float:
        """
        Get score for MoSCoW priority.

        Args:
            priority: MoSCoW priority value

        Returns:
            Score from 0 to 100
        """
        return float(RequirementCalculator.MOSCOW_SCORES.get(priority, 50))

    @staticmethod
    def get_kano_score(category: str) -> float:
        """
        Get score for Kano category.

        Args:
            category: Kano category value

        Returns:
            Score from 0 to 100
        """
        return float(RequirementCalculator.KANO_SCORES.get(category, 50))

    @staticmethod
    def calculate_rice_score(rice_analysis: Dict[str, int]) -> float:
        """
        Calculate RICE score.

        RICE: (Reach × Impact × Confidence) / Effort

        Args:
            rice_analysis: Dictionary with reach, impact, confidence, effort values (1-10)

        Returns:
            RICE score
        """
        reach = rice_analysis.get("reach", 5)
        impact = rice_analysis.get("impact", 5)
        confidence = rice_analysis.get("confidence", 5)
        effort = rice_analysis.get("effort", 5)

        if effort == 0:
            return 0.0

        score = (reach * impact * confidence) / effort
        return round(score, 2)

    @staticmethod
    def calculate_overall_score(
        invest_analysis: Optional[Dict[str, bool]] = None,
        moscow_priority: Optional[str] = None,
        kano_category: Optional[str] = None,
        rice_analysis: Optional[Dict[str, int]] = None,
    ) -> float:
        """
        Calculate overall requirement score using weighted average.

        Weights:
        - INVEST: 30%
        - MoSCoW: 20%
        - Kano: 20%
        - RICE: 30%

        Args:
            invest_analysis: INVEST analysis data
            moscow_priority: MoSCoW priority
            kano_category: Kano category
            rice_analysis: RICE analysis data

        Returns:
            Overall score from 0 to 100
        """
        weights = RequirementCalculator.OVERALL_WEIGHTS

        # Calculate individual scores
        invest_score = 0.0
        if invest_analysis:
            invest_score = RequirementCalculator.calculate_invest_score(invest_analysis)

        moscow_score = 0.0
        if moscow_priority:
            moscow_score = RequirementCalculator.get_moscow_score(moscow_priority)

        kano_score = 0.0
        if kano_category:
            kano_score = RequirementCalculator.get_kano_score(kano_category)

        rice_score = 0.0
        if rice_analysis:
            rice_score = RequirementCalculator.calculate_rice_score(rice_analysis)

        # Calculate weighted average
        overall = (
            invest_score * weights["invest"]
            + moscow_score * weights["moscow"]
            + kano_score * weights["kano"]
            + rice_score * weights["rice"]
        )

        return round(overall, 2)

    @staticmethod
    def calculate_priority_score(
        business_value: int,
        technical_complexity: int,
        estimated_hours: int,
        overall_analysis_score: float,
    ) -> float:
        """
        Calculate final priority score.

        Formula:
        Priority Score = (Business Value * 0.4)
                       + ((10 - Technical Complexity) * 0.3)
                       + (Normalized Hours * 0.2)
                       + (Overall Analysis Score * 0.1)

        Args:
            business_value: Business value rating (1-10)
            technical_complexity: Technical complexity rating (1-10)
            estimated_hours: Estimated hours for implementation
            overall_analysis_score: Overall analysis score (0-100)

        Returns:
            Priority score from 0 to 100
        """
        # Business value component (higher is better)
        business_component = business_value * 10

        # Technical complexity component (lower complexity is better)
        complexity_component = (10 - technical_complexity) * 10

        # Hours component (normalize: 0 hours = 100, 100+ hours = 0)
        hours_component = max(0, 100 - estimated_hours)

        # Overall analysis score component
        analysis_component = overall_analysis_score

        # Calculate weighted sum
        priority_score = (
            business_component * 0.4
            + complexity_component * 0.3
            + hours_component * 0.2
            + analysis_component * 0.1
        )

        return round(min(max(priority_score, 0), 100), 2)

    @staticmethod
    def calculate_risk_score(requirement: Dict[str, Any]) -> float:
        """
        Calculate risk score for a requirement.

        Factors:
        - Technical complexity (higher = more risk)
        - Lack of user validation
        - Unclear requirements
        - Dependencies

        Args:
            requirement: Requirement dictionary

        Returns:
            Risk score from 0 (low risk) to 100 (high risk)
        """
        risk_score = 0.0

        # Technical complexity risk
        complexity = requirement.get("technical_complexity", 5)
        risk_score += complexity * 3

        # Business value (higher business value = higher risk if failed)
        business_value = requirement.get("business_value", 5)
        risk_score += business_value * 2

        # Description length (shorter description = higher risk)
        description = requirement.get("description", "")
        if len(description) < 50:
            risk_score += 20
        elif len(description) < 100:
            risk_score += 10

        # User story completeness
        user_role = requirement.get("user_role", "")
        user_action = requirement.get("user_action", "")
        user_benefit = requirement.get("user_benefit", "")

        if not all([user_role, user_action, user_benefit]):
            risk_score += 15

        # Estimated hours (longer = higher risk)
        estimated_hours = requirement.get("estimated_hours", 0)
        if estimated_hours > 100:
            risk_score += 20
        elif estimated_hours > 50:
            risk_score += 10

        return round(min(max(risk_score, 0), 100), 2)

    @staticmethod
    def calculate_effort_score(
        technical_complexity: int,
        estimated_hours: int,
        dependencies: int = 0,
    ) -> float:
        """
        Calculate effort score.

        Args:
            technical_complexity: Technical complexity rating (1-10)
            estimated_hours: Estimated hours
            dependencies: Number of dependencies

        Returns:
            Effort score from 0 to 100
        """
        # Complexity component
        complexity_score = technical_complexity * 10

        # Hours component (normalize: 0 hours = 0, 100+ hours = 100)
        hours_score = min(estimated_hours, 100)

        # Dependencies component
        dependencies_score = min(dependencies * 10, 30)

        # Total effort score
        effort_score = (
            complexity_score * 0.4
            + hours_score * 0.4
            + dependencies_score * 0.2
        )

        return round(min(max(effort_score, 0), 100), 2)

    @staticmethod
    def analyze_requirements_batch(requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze a batch of requirements and generate summary statistics.

        Args:
            requirements: List of requirement dictionaries

        Returns:
            Dictionary with analysis results and statistics
        """
        if not requirements:
            return {
                "total": 0,
                "average_priority_score": 0,
                "average_risk_score": 0,
                "total_estimated_hours": 0,
                "moscow_distribution": {},
                "kano_distribution": {},
                "by_status": {},
            }

        total = len(requirements)

        # Calculate scores
        priority_scores = [
            req.get("priority_score", 0) for req in requirements
        ]
        risk_scores = [
            RequirementCalculator.calculate_risk_score(req) for req in requirements
        ]
        estimated_hours = [
            req.get("estimated_hours", 0) for req in requirements
        ]

        # MoSCoW distribution
        moscow_dist = {}
        for req in requirements:
            priority = req.get("moscow_priority", "unknown")
            moscow_dist[priority] = moscow_dist.get(priority, 0) + 1

        # Kano distribution
        kano_dist = {}
        for req in requirements:
            category = req.get("kano_category", "unknown")
            kano_dist[category] = kano_dist.get(category, 0) + 1

        # Status distribution
        status_dist = {}
        for req in requirements:
            status = req.get("status", "unknown")
            status_dist[status] = status_dist.get(status, 0) + 1

        return {
            "total": total,
            "average_priority_score": round(sum(priority_scores) / total, 2),
            "average_risk_score": round(sum(risk_scores) / total, 2),
            "total_estimated_hours": sum(estimated_hours),
            "moscow_distribution": moscow_dist,
            "kano_distribution": kano_dist,
            "by_status": status_dist,
        }

    @staticmethod
    def recommend_priority(
        requirements: List[Dict[str, Any]], limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Recommend requirements to prioritize based on score.

        Args:
            requirements: List of requirement dictionaries
            limit: Maximum number of recommendations

        Returns:
            List of recommended requirements sorted by priority score
        """
        # Sort by priority score (descending)
        sorted_requirements = sorted(
            requirements,
            key=lambda x: x.get("priority_score", 0),
            reverse=True,
        )

        return sorted_requirements[:limit]

    @staticmethod
    def identify_high_risk(
        requirements: List[Dict[str, Any]], threshold: float = 70.0
    ) -> List[Dict[str, Any]]:
        """
        Identify high-risk requirements.

        Args:
            requirements: List of requirement dictionaries
            threshold: Risk score threshold (default: 70)

        Returns:
            List of high-risk requirements
        """
        high_risk = []

        for req in requirements:
            risk_score = RequirementCalculator.calculate_risk_score(req)
            if risk_score >= threshold:
                req_with_risk = req.copy()
                req_with_risk["risk_score"] = risk_score
                high_risk.append(req_with_risk)

        # Sort by risk score (descending)
        high_risk.sort(key=lambda x: x["risk_score"], reverse=True)

        return high_risk
