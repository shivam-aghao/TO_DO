import logging
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from backend.config import settings

logger = logging.getLogger("study_os.supabase")

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """
    Returns the Supabase client instance if credentials are configured.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Supabase client initialized successfully.")
            return _supabase_client
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    return None

def is_supabase_configured() -> bool:
    """Checks whether valid Supabase configuration is present."""
    return bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)

