import os
import jwt
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.models.users import UserProfile  # adjust import if your path differs


def _get_user_uuid_from_supabase_jwt(request):
    """
    Extract and verify Supabase access token from Authorization: Bearer <token>.
    Returns user UUID (sub).
    """
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None, Response({"error": "No Authorization Provided"}, status=401)

    try:
        token = auth_header.split(" ", 1)[1]
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],           # works for legacy HS256 projects
            audience="authenticated"
        )
        return payload["sub"], None
    except Exception:
        return None, Response({"error": "invalid jwt or invalid jwt format"}, status=401)


def _serialize_profile(profile: UserProfile):
    return {
        "uuid": str(profile.uuid),
        "name": profile.name,
        "major": profile.major,
        "minor": profile.minor,
        "expected_grad": profile.expected_grad,
        "year": profile.year,
        "completed_lower_div_units": profile.completed_lower_div_units,
        "completed_upper_div_units": profile.completed_upper_div_units,
        "gpa": profile.gpa,
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
        uuid=user_uuid,
        defaults={"created_at": timezone.now()}
    )

    return Response(_serialize_profile(profile), status=200)


@api_view(["PATCH", "PUT"])
def update_profile(request):
    user_uuid, err = _get_user_uuid_from_supabase_jwt(request)
    if err:
        return err

    profile, _created = UserProfile.objects.get_or_create(
        uuid=user_uuid,
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
