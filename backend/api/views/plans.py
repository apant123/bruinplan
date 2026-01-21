from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import uuid

from api.models import Plan, User  # <-- add User

def _debug_auth(request):
    print("=== AUTH DEBUG ===")
    print("Authorization header:", request.headers.get("Authorization"))
    print("X-User-Id header:", request.headers.get("X-User-Id"))
    print("request.user:", request.user)
    print("is_authenticated:", getattr(request.user, "is_authenticated", None))
    print("request.user.id:", getattr(request.user, "id", None))
    print("==================")

def _get_user_uuid(request):
    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False):
        return getattr(user, "id", None)

    x = request.headers.get("X-User-Id")
    if not x:
        return None
    try:
        return uuid.UUID(x)
    except ValueError:
        return "invalid"

def _resolve_plan_user_id(request):
    user_uuid = _get_user_uuid(request)
    if user_uuid is None:
        return None, Response(
            {"error": "unauthenticated: no request.user.id and no X-User-Id header"},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if user_uuid == "invalid":
        return None, Response(
            {"error": "X-User-Id must be a UUID"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    u = User.objects.filter(id=user_uuid).only("id").first()
    if not u:
        return None, Response(
            {"error": f"unknown user uuid {user_uuid}"},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return u.id, None

@api_view(["GET", "POST"])
def plans_view(request):
    _debug_auth(request)

    plan_user_id, err = _resolve_plan_user_id(request)
    if err:
        return err

    if request.method == "GET":
        qs = Plan.objects.filter(user_id=plan_user_id).order_by("-updated_at", "-created_at")
        data = [
            {
                "id": p.id,
                "user_id": str(p.user_id),
                "name": p.name,
                "start_year": p.start_year,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            }
            for p in qs
        ]
        return Response({"plans": data})

    name = request.data.get("name")
    start_year = request.data.get("start_year", None)

    if not name or not isinstance(name, str) or not name.strip():
        return Response({"error": "name is required"}, status=status.HTTP_400_BAD_REQUEST)

    p = Plan.objects.create(
        user_id=plan_user_id,
        name=name.strip(),
        start_year=start_year,
    )

    return Response(
        {
            "id": p.id,
            "user_id": str(p.user_id),
            "name": p.name,
            "start_year": p.start_year,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        },
        status=status.HTTP_201_CREATED,
        )
