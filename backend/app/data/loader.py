"""
Central data loading module — reads Transfermarkt CSVs into cached DataFrames.
Uses a singleton pattern to avoid re-reading on every request.
"""
import pandas as pd
import logging
from typing import Optional
from backend.app.config import PLAYER_VALUES_CSV, VALUE_HISTORY_CSV

logger = logging.getLogger(__name__)


class DataStore:
    """Singleton data store that caches DataFrames in memory."""
    _instance: Optional["DataStore"] = None
    _player_values: Optional[pd.DataFrame] = None
    _value_history: Optional[pd.DataFrame] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_player_values(self) -> pd.DataFrame:
        """Load and clean transfermarkt_player_values.csv."""
        logger.info("Loading player values from %s", PLAYER_VALUES_CSV)
        df = pd.read_csv(PLAYER_VALUES_CSV)

        # Clean numeric columns that might have formatting issues
        numeric_cols = [
            'current_value_eur', 'peak_value_eur', 'first_value_eur', 'last_value_eur',
            'age', 'age_at_peak', 'career_span_years', 'years_to_peak',
            'value_cagr', 'value_to_peak_cagr', 'value_multiplier_x',
            'post_peak_decline_pct', 'value_volatility', 'mean_yoy_growth_rate',
            'num_valuation_points', 'num_clubs_career'
        ]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Fill NaN in key columns
        df['position_group'] = df['position_group'].fillna('Other')
        df['league_name'] = df['league_name'].fillna('Other')
        df['trajectory'] = df['trajectory'].fillna('stable')
        df['nationality'] = df['nationality'].fillna('Unknown')
        df['current_club'] = df['current_club'].fillna('Unknown')

        logger.info("Loaded %d players from player_values dataset.", len(df))
        return df

    def _load_value_history(self) -> pd.DataFrame:
        """Load and clean transfermarkt_value_history.csv."""
        logger.info("Loading value history from %s", VALUE_HISTORY_CSV)
        df = pd.read_csv(VALUE_HISTORY_CSV)

        # Parse valuation_date
        df['valuation_date'] = pd.to_datetime(df['valuation_date'], format='%d/%m/%Y', errors='coerce')
        df['value_eur'] = pd.to_numeric(df['value_eur'], errors='coerce')
        df['age_at_date'] = pd.to_numeric(df['age_at_date'], errors='coerce')

        # Sort by player and date
        df = df.sort_values(['player_id', 'valuation_date']).reset_index(drop=True)

        logger.info("Loaded %d value history records.", len(df))
        return df

    @property
    def player_values(self) -> pd.DataFrame:
        if self._player_values is None:
            DataStore._player_values = self._load_player_values()
        return self._player_values

    @property
    def value_history(self) -> pd.DataFrame:
        if self._value_history is None:
            DataStore._value_history = self._load_value_history()
        return self._value_history

    def get_player_by_id(self, player_id: int) -> Optional[dict]:
        """Get a single player's data by ID."""
        df = self.player_values
        match = df[df['player_id'] == player_id]
        if match.empty:
            return None
        return match.iloc[0].to_dict()

    def search_players(self, query: str, limit: int = 20) -> list[dict]:
        """Search players by name (case-insensitive partial match)."""
        df = self.player_values
        query = query.strip().lower()
        if not query:
            return []

        # Exact match first, then partial
        exact = df[df['name'].str.lower() == query]
        if not exact.empty:
            return exact.head(limit).to_dict('records')

        partial = df[df['name'].str.lower().str.contains(query, na=False)]
        return partial.sort_values('current_value_eur', ascending=False).head(limit).to_dict('records')

    def get_player_value_history(self, player_id: int) -> list[dict]:
        """Get value history for a specific player."""
        df = self.value_history
        player_hist = df[df['player_id'] == player_id].copy()
        if player_hist.empty:
            return []
        player_hist = player_hist.sort_values('valuation_date')
        player_hist['valuation_date'] = player_hist['valuation_date'].dt.strftime('%Y-%m-%d')
        return player_hist.to_dict('records')

    def get_top_players(self, limit: int = 50, league: str = None, position: str = None) -> list[dict]:
        """Get top players by current value, with optional filters."""
        df = self.player_values.copy()
        if league and league != 'all':
            df = df[df['league_name'] == league]
        if position and position != 'all':
            df = df[df['position_group'] == position]
        return df.nlargest(limit, 'current_value_eur').to_dict('records')

    def get_league_stats(self) -> list[dict]:
        """Aggregate statistics per league."""
        df = self.player_values
        stats = df.groupby('league_name').agg(
            player_count=('player_id', 'count'),
            avg_value=('current_value_eur', 'mean'),
            total_value=('current_value_eur', 'sum'),
            max_value=('current_value_eur', 'max'),
            avg_age=('age', 'mean'),
        ).reset_index()
        stats = stats.sort_values('total_value', ascending=False)
        return stats.to_dict('records')

    def get_position_distribution(self) -> list[dict]:
        """Get player count and avg value by position group."""
        df = self.player_values
        stats = df.groupby('position_group').agg(
            count=('player_id', 'count'),
            avg_value=('current_value_eur', 'mean'),
        ).reset_index()
        return stats.to_dict('records')

    def get_summary_stats(self) -> dict:
        """Get high-level dashboard summary."""
        df = self.player_values
        top_player = df.loc[df['current_value_eur'].idxmax()]
        top_league = df.groupby('league_name')['current_value_eur'].sum().idxmax()
        return {
            "total_players": int(len(df)),
            "avg_value": float(df['current_value_eur'].mean()),
            "max_value": float(df['current_value_eur'].max()),
            "top_player_name": str(top_player['name']),
            "top_player_id": int(top_player['player_id']),
            "top_player_value": float(top_player['current_value_eur']),
            "top_league": str(top_league),
            "total_leagues": int(df['league_name'].nunique()),
            "trajectory_distribution": df['trajectory'].value_counts().to_dict(),
        }


# Module-level singleton
data_store = DataStore()
