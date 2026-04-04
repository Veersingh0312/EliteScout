"""
Player data API routes.
"""
import math
from fastapi import APIRouter, Query
from backend.app.data.loader import data_store
from backend.app.config import PLAYER_IMAGE_URL

router = APIRouter(prefix="/api", tags=["players"])


def sanitize(val):
    """Replace NaN/inf with None for JSON serialization."""
    if val is None:
        return None
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return None
    return val


def enrich_player(player: dict) -> dict:
    """Add image URL and sanitize a player dict for JSON response."""
    player_id = player.get('player_id')
    enriched = {k: sanitize(v) for k, v in player.items()}
    enriched['image_url'] = PLAYER_IMAGE_URL.format(player_id=player_id) if player_id else None
    return enriched


@router.get("/top-players")
async def top_players(
    limit: int = Query(50, ge=1, le=200),
    league: str = Query(None),
    position: str = Query(None),
):
    """Get top players by current market value with optional filters."""
    players = data_store.get_top_players(limit=limit, league=league, position=position)
    return {"players": [enrich_player(p) for p in players]}


@router.get("/player-search")
async def player_search(q: str = Query(..., min_length=1)):
    """Search players by name."""
    results = data_store.search_players(q)
    return {"results": [enrich_player(p) for p in results]}


@router.get("/player-analysis/{player_id}")
async def player_analysis(player_id: int):
    """Get full player profile with value history."""
    player = data_store.get_player_by_id(player_id)
    if not player:
        return {"error": "Player not found", "player": None, "value_history": []}

    history = data_store.get_player_value_history(player_id)

    return {
        "player": enrich_player(player),
        "value_history": history,
    }


@router.get("/league-analysis")
async def league_analysis():
    """Get aggregate statistics per league."""
    stats = data_store.get_league_stats()
    sanitized = []
    for s in stats:
        sanitized.append({k: sanitize(v) for k, v in s.items()})
    return {"leagues": sanitized}


@router.get("/position-distribution")
async def position_distribution():
    """Get player count and avg value by position group."""
    dist = data_store.get_position_distribution()
    sanitized = []
    for d in dist:
        sanitized.append({k: sanitize(v) for k, v in d.items()})
    return {"positions": sanitized}


@router.get("/dashboard-summary")
async def dashboard_summary():
    """Get high-level summary stats for the dashboard."""
    summary = data_store.get_summary_stats()
    return {k: sanitize(v) for k, v in summary.items()}


@router.get("/leagues-list")
async def leagues_list():
    """Get list of unique league names for filters."""
    df = data_store.player_values
    leagues = sorted(df['league_name'].dropna().unique().tolist())
    return {"leagues": leagues}


@router.get("/positions-list")
async def positions_list():
    """Get list of unique position groups for filters."""
    df = data_store.player_values
    positions = sorted(df['position_group'].dropna().unique().tolist())
    return {"positions": positions}
