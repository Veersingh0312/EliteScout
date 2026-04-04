"""
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional


class PredictionInput(BaseModel):
    """Input for market value prediction."""
    age: float = Field(..., ge=15, le=45, description="Player age")
    position_group: str = Field(..., description="Position group (Attack, Midfield, Defender, Goalkeeper, Other)")
    league_name: str = Field(..., description="League name")
    career_span_years: float = Field(5.0, ge=0, le=25)
    value_cagr: float = Field(0.5, description="Compound annual growth rate")
    value_multiplier_x: float = Field(2.0, ge=0)
    value_volatility: float = Field(0.5, ge=0)
    age_at_peak: int = Field(27, ge=18, le=40)
    peak_value_eur: float = Field(50000000, ge=0)
    years_to_peak: float = Field(5.0, ge=0)
    num_clubs_career: int = Field(3, ge=1)


class PredictionOutput(BaseModel):
    """Output for market value prediction."""
    predicted_value: float
    predicted_value_formatted: str
    model_used: str
    feature_importances: dict[str, float] = {}


class TrajectoryInput(BaseModel):
    """Input for trajectory classification."""
    age: float = Field(..., ge=15, le=45)
    position_group: str
    league_name: str
    career_span_years: float = 5.0
    value_cagr: float = 0.5
    value_multiplier_x: float = 2.0
    value_volatility: float = 0.5
    age_at_peak: int = 27
    post_peak_decline_pct: float = 0.0
    is_at_peak: int = 0
    peak_value_eur: float = 50000000
    years_to_peak: float = 5.0
    mean_yoy_growth_rate: float = 0.1
    num_clubs_career: int = 3


class TrajectoryOutput(BaseModel):
    """Output for trajectory classification."""
    predicted_trajectory: str
    confidence: float
    probabilities: dict[str, float] = {}


class PlayerSummary(BaseModel):
    """Brief player info for cards and lists."""
    player_id: int
    name: str
    age: Optional[float] = None
    nationality: Optional[str] = None
    position: Optional[str] = None
    position_group: Optional[str] = None
    current_club: Optional[str] = None
    league_name: Optional[str] = None
    current_value_eur: Optional[float] = None
    peak_value_eur: Optional[float] = None
    trajectory: Optional[str] = None
    image_url: Optional[str] = None


class ValueHistoryPoint(BaseModel):
    """Single point in a player's value history."""
    valuation_date: str
    value_eur: float
    club: Optional[str] = None
    age_at_date: Optional[int] = None


class PlayerDetail(BaseModel):
    """Full player profile with value history."""
    player: PlayerSummary
    value_history: list[ValueHistoryPoint] = []
    peak_value_eur: Optional[float] = None
    age_at_peak: Optional[int] = None
    career_span_years: Optional[float] = None
    value_cagr: Optional[float] = None
    value_volatility: Optional[float] = None
    post_peak_decline_pct: Optional[float] = None


class ForecastPoint(BaseModel):
    """A forecasted value point."""
    year: int
    predicted_value: float
    is_forecast: bool = True


class ModelMetrics(BaseModel):
    """Model evaluation metrics."""
    model_name: str
    model_type: str  # regression, classification, timeseries
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    feature_importances: dict[str, float] = {}
