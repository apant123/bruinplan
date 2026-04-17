import os
import jwt
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.models.users import UserProfile  # adjust import if your path differs


from supabase import create_client, Client
import uuid

def _get_user_uuid_from_supabase_jwt(request):
    """
    Extract and verify Supabase access token from Authorization: Bearer <token>.
    Returns user UUID (sub). Fallback to X-User-Id for testing.
    """
    # 1. Fallback / Session auth check
    x_user_id = request.headers.get("X-User-Id")
    if x_user_id:
        try:
            return uuid.UUID(x_user_id), None
        except ValueError:
            return None, Response({"error": "invalid X-User-Id format"}, status=401)

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None, Response({"error": "No Authorization Provided"}, status=401)

    try:
        token = auth_header.split(" ", 1)[1]
        
        # Initialize client and verify token via SDK
        supabase_client: Client = create_client(supabase_url, supabase_key)
        user_res = supabase_client.auth.get_user(token)
        
        if not user_res or not user_res.user:
            return None, Response({"error": "Invalid authentication token"}, status=401)
            
        return user_res.user.id, None
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None, Response({"error": "invalid jwt or invalid jwt format"}, status=401)


def _serialize_profile(profile: UserProfile):
    return {
        "id": str(profile.id),
        "name": profile.name,
        "major": profile.major,
        "minor": profile.minor,
        "expected_grad": profile.expected_grad,
        "year": profile.year,
        "completed_lower_div_units": profile.completed_lower_div_units,
        "completed_upper_div_units": profile.completed_upper_div_units,
        "gpa": profile.gpa,
        "classes_taken": profile.classes_taken,
        "classes_needed": profile.classes_needed,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
    }


@api_view(["GET"])
def get_profile(request):
    user_uuid, err = _get_user_uuid_from_supabase_jwt(request)
    if err:
        return err

    # Create profile on first login (so you don't need a createUser endpoint)
    profile, _created = UserProfile.objects.get_or_create(
        id=user_uuid,
        defaults={"created_at": timezone.now()}
    )

    return Response(_serialize_profile(profile), status=200)


@api_view(["PATCH", "PUT"])
def update_profile(request):
    user_uuid, err = _get_user_uuid_from_supabase_jwt(request)
    if err:
        return err

    profile, _created = UserProfile.objects.get_or_create(
        id=user_uuid,
        defaults={"created_at": timezone.now()}
    )

    # Only allow these fields to be set from the client
    allowed_fields = {
        "name",
        "major",
        "minor",
        "expected_grad",
        "year",
        "completed_lower_div_units",
        "completed_upper_div_units",
        "gpa",
    }

    for key, value in request.data.items():
        if key in allowed_fields:
            setattr(profile, key, value)

    profile.save()

    return Response(_serialize_profile(profile), status=200)
